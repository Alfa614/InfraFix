import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';
import OpenAI from "openai";

const prisma = new PrismaClient();
const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Helper to analyze new report 
async function analyzeReport(report, imagePath) {
  const messages = [
    {
      role: "system",
      content: "You are an expert infrastructure inspector. Analyze severity and urgency."
    },
    {
      role: "user",
      content: [
        { type: "text", text: `Title: ${report.title}\nDescription: ${report.description}\nCategory: ${report.category}` }
      ]
    }
  ];

  if (imagePath) {
    messages[1].content.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${fs.readFileSync(imagePath).toString("base64")}`
      }
    });
  }

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 150
  });

  try {
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return { severity: "Medium", urgency: "Within a week" }; // fallback
  }
}


// Helper: evaluate a contractor bid
async function evaluateBid(report, bid) {
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a construction cost estimator." },
      { role: "user", content: `
        Report: ${report.title} (${report.category}) - ${report.description}
        Severity: ${report.severity}, Urgency: ${report.urgency}
        Contractor bid: ${bid.amount} - ${bid.description}

        Decide if this bid is Reasonable or Unreasonable.
        Return JSON: {"aiEvaluation": "Reasonable" or "Unreasonable"}
      `}
    ],
    max_tokens: 100
  });

 try {
  return JSON.parse(res.choices[0].message.content);
} catch {
  if (bid.amount < 1000) {
    return { aiEvaluation: "Reasonable" };
  } else {
    return { aiEvaluation: "Unreasonable" };
  }
}
}

// GET all reports
router.get('/', async (req, res) => {
  const { q, status, category } = req.query;
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (q) {
      where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { address: { contains: q } },
      { category: { contains: q } }
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: [{ upvotes: { _count: 'desc' } }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, name: true } },
      images: true,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { upvotes: true } }
    }
  });
  res.json(reports);
});

// GET single report
router.get('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user?.id || null;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      images: true,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }
      },
      upvotes: { select: { userId: true } },
      _count: { select: { upvotes: true } }
    }
  });

  if (!report) return res.status(404).json({ error: 'Not found' });

  res.json({ ...report, currentUserId: userId });
});

// CREATE report
router.post('/', requireAuth, upload.array('images'), async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }

    const images = (req.files || []).map(file => ({
      url: `/uploads/${file.filename}`
    }));

    let analysis = {};
    const uploadDirOutput = path.join(process.cwd(), 'uploads/output');
    if (!fs.existsSync(uploadDirOutput)) fs.mkdirSync(uploadDirOutput, { recursive: true });
    if (category.toLowerCase() === 'road' && req.files?.length > 0) {
      const { spawn } = await import('child_process');
      const firstImagePath = req.files[0].path;

      const python = spawn('python', [
        'src/ml/pothole_inference.py',
        firstImagePath,
        uploadDirOutput,
        'src/ml/best.pt'
      ]);

      let output = '';
      python.stdout.on('data', data => (output += data.toString()));
      python.stderr.on('data', err => console.error('Python error:', err.toString()));

      await new Promise(resolve => python.on('close', resolve));

      const [severity, processedPath] = output.trim().split('|');
      let relativeProcessed = null;
      if (processedPath) {
        const normalized = processedPath.replace(/\\/g, '/');
        const uploadsIndex = normalized.indexOf('/uploads/');
        if (uploadsIndex !== -1) {
          relativeProcessed = normalized.substring(uploadsIndex); 
        } else {
          const outputIndex = normalized.indexOf('/output/');
          relativeProcessed = outputIndex !== -1
            ? '/uploads' + normalized.substring(outputIndex)
            : null;
        }
      }

      analysis = {
        severity: severity || 'Medium',
        urgency: 'Within a week',
        processedImage: relativeProcessed
      };
  }else{if (req.files?.length > 0) {
      const firstImagePath = req.files[0].path;
      analysis = await analyzeReport({ title, description, category }, firstImagePath);
    } else {
      analysis = await analyzeReport({ title, description, category });
    }}

    const report = await prisma.report.create({
      data: {
        title,
        description,
        category,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        userId: req.user.id,
        severity: analysis.severity || "Medium", 
        urgency: analysis.urgency || "Within a week",
        processedImage: analysis.processedImage || null, 
        images: { create: images }
      },
    });


    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// UPDATE report
router.put('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.report.findUnique({ where: { id }, include: { images: true } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const { title, description, category, latitude, longitude, address, status, images } = req.body;

  const updateData = {
    title: title ?? existing.title,
    description: description ?? existing.description,
    category: category ?? existing.category,
    address: address ?? existing.address,
    latitude: latitude !== undefined ? Number(latitude) : existing.latitude,
    longitude: longitude !== undefined ? Number(longitude) : existing.longitude,
    status: status || existing.status
  };

  if (images && Array.isArray(images)) {
    updateData.images = {
      deleteMany: {}, // remove old
      create: images.map(url => ({ url }))
    };
  }

  const report = await prisma.report.update({
    where: { id },
    data: updateData,
    include: { images: true }
  });

  res.json(report);
});

// DELETE report (admin only)
router.delete('/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.report.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  await prisma.comment.deleteMany({ where: { reportId: id } });
  await prisma.upvote.deleteMany({ where: { reportId: id } });
  await prisma.bid.deleteMany({ where: { reportId: id } }); 
  await prisma.image.deleteMany({ where: { reportId: id } });
  await prisma.report.delete({ where: { id } });

  res.json({ ok: true });
});

// ADD comment
router.post('/:id/comment', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });

  const comment = await prisma.comment.create({
    data: { text, reportId: id, userId: req.user.id },
    include: { user: { select: { id: true, name: true } } }
  });
  res.status(201).json(comment);
});

// TOGGLE UPVOTE
router.post('/:id/upvote', requireAuth, async (req, res) => {
  const reportId = Number(req.params.id);
  const userId = req.user.id;

  try {
    const existing = await prisma.upvote.findUnique({
      where: { userId_reportId: { userId, reportId } }
    });

    if (existing) {
      await prisma.upvote.delete({ where: { id: existing.id } });
    } else {
      await prisma.upvote.create({ data: { userId, reportId } });
    }

    const updated = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: { select: { id: true, name: true } },
        images: true,
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        upvotes: { select: { userId: true } },
        _count: { select: { upvotes: true } }
      }
    });

    res.json({ ...updated, currentUserId: userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle upvote' });
  }
});

// UPDATE status (admin only)
router.post('/:id/status', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin only' });

  const updated = await prisma.report.update({
    where: { id },
    data: { status }
  });
  res.json(updated);
});


// CONTRACTOR: Place a bid
// ADD bid
router.post('/:id/bids', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { amount, description } = req.body;

  if (req.user.role !== 'CONTRACTOR') {
    return res.status(403).json({ error: 'Only contractors can bid' });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return res.status(404).json({ error: 'Report not found' });

  // AI evaluate the bid
  const evaluation = await evaluateBid(report, { amount, description });

  const bid = await prisma.bid.create({
    data: {
      amount: parseFloat(amount),
      description,
      contractorId: req.user.id,
      reportId: id,
      aiEvaluation: evaluation.aiEvaluation
    },
    include: { contractor: { select: { id: true, name: true } } }
  });

  res.status(201).json(bid);
});


// GET all bids for a report
router.get('/:id/bids', async (req, res) => {
  const reportId = Number(req.params.id);
  const bids = await prisma.bid.findMany({
    where: { reportId },
    include: { contractor: { select: { id: true, name: true } } },
    orderBy: { amount: 'asc' }
  });
  res.json(bids);
});

// DELETE bid (contractor only)
router.delete('/bids/:bidId', requireAuth, async (req, res) => {
  const bidId = Number(req.params.bidId);
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) return res.status(404).json({ error: 'Not found' });
  if (bid.contractorId !== req.user.id) return res.status(403).json({ error: 'Not allowed' });

  await prisma.bid.delete({ where: { id: bidId } });
  res.json({ ok: true });
});

export default router;