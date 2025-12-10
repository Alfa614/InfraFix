import React, { useState } from 'react';
import { api } from '../api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Vite/React projects
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Helper: click map to pick location
function LocationPicker({ setLat, setLng }) {
  useMapEvents({
    click(e) {
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    }
  });
  return null;
}

export default function NewReport({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Road');
  const [latitude, setLatitude] = useState(19.9975);   //  Nashik default
  const [longitude, setLongitude] = useState(73.7898); //  Nashik default
  const [address, setAddress] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('category', category);
    form.append('latitude', latitude);
    form.append('longitude', longitude);
    form.append('address', address);
    for (const f of images) form.append('images', f);
    try {
      const { data } = await api.post('/reports', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(data.id);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create report');
    }
  }

  return (
    <form className="card max-w-2xl mx-auto space-y-3" onSubmit={submit}>
      <h2 className="text-xl font-semibold">Report an Issue</h2>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div>
        <label>Title</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} />
      </div>

      <div>
        <label>Description</label>
        <textarea rows="4" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>

      <div>
        <label>Category</label>
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option>Road</option>
          <option>Lighting</option>
          <option>Water</option>
          <option>Garbage</option>
          <option>Safety</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label>Pick Location</label>
        <MapContainer
          center={[latitude, longitude]}
          zoom={13} 
          style={{ height: "300px", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={[latitude, longitude]} />
          <LocationPicker setLat={setLatitude} setLng={setLongitude} />
        </MapContainer>
        <div className="text-sm text-gray-500 mt-1">
          Selected: {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </div>
      </div>

      <div>
        <label>Address (optional)</label>
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Area, City" />
      </div>

      <div>
        <label>Images</label>
        <input type="file" multiple onChange={e=>setImages([...e.target.files])} />
      </div>

      <button className="btn btn-primary w-full">Submit</button>
    </form>
  );
}
