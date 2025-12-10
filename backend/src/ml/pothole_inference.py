
import sys
import os
import warnings
import cv2
import numpy as np
import logging
import contextlib, io
from ultralytics import YOLO


warnings.filterwarnings("ignore")
logging.getLogger("ultralytics").setLevel(logging.CRITICAL)

input_path = sys.argv[1]
output_dir = sys.argv[2]
model_path = sys.argv[3]

os.makedirs(output_dir, exist_ok=True)

model = YOLO(model_path)

with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
    results = model.predict(source=input_path, conf=0.25, save=False)


severity = "MEDIUM"
for r in results:
    confs = r.boxes.conf.cpu().numpy().tolist() if r.boxes is not None else []
    if any(c > 0.7 for c in confs):
        severity = "HIGH"
        break


annotated_dir = os.path.join(output_dir, 'results')
os.makedirs(annotated_dir, exist_ok=True)


result = results[0]
annotated_image = result.plot()  
annotated_path = os.path.join(annotated_dir, os.path.basename(input_path))

ok = cv2.imwrite(annotated_path, annotated_image)
if not ok:
    print("Error: failed to write image", file=sys.stderr)
    sys.exit(1)


print(f"{severity}|{annotated_path}")
sys.stdout.flush()
