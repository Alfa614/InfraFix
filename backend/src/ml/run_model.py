import sys
import torch
from ultralytics import YOLO
import os
import json


image_path = sys.argv[1]
output_dir = sys.argv[2]


model = YOLO("best.pt")  

results = model(image_path, save=True, project=output_dir, name='results', exist_ok=True)


detected_severities = []
for r in results:
   
    for box in r.boxes:
        detected_severities.append("HIGH" if box.conf.item() > 0.7 else "MEDIUM")

overall = "HIGH" if "HIGH" in detected_severities else "MEDIUM"

output_folder = os.path.join(output_dir, 'results')
image_files = [f for f in os.listdir(output_folder) if f.endswith('.jpg') or f.endswith('.png')]
processed_image = os.path.join('uploads', 'output', image_files[0]) if image_files else None

print(json.dumps({"severity": overall, "processed": processed_image}))