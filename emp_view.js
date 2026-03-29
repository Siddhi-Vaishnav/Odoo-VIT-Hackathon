import { useRef, useState, useEffect } from "react";

export default function App() {
  const videoRef = useRef();

  const [image, setImage] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [expenses, setExpenses] = useState([]);

  // Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setImage(URL.createObjectURL(file));
    sendToOCR(file);
  };

  // Camera start
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // Capture image
  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      setImage(URL.createObjectURL(blob));
      sendToOCR(blob);
    });
  };

  // OCR API call
  const sendToOCR = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/ocr", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setOcrData({
      description: data.description || "",
      amount: data.amount || "",
      date: data.date || "",
      category: data.category || "General",
    });
  };

  // Save expense
  const saveExpense = () => {
    setExpenses([
      ...expenses,
      {
        employee: "You",
        ...ocrData,
        status: "Draft",
      },
    ]);

    setOcrData(null);
    setImage(null);
  };

  // Summary calculations
  const draftTotal = expenses
    .filter((e) => e.status === "Draft")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const submittedTotal = expenses
    .filter((e) => e.status === "Submitted")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const approvedTotal = expenses
    .filter((e) => e.status === "Approved")
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Employee Expense Dashboard</h2>

      {/* Summary */}
      <div style={{ display: "flex", gap: 20 }}>
        <div>Draft: ₹{draftTotal}</div>
        <div>Submitted: ₹{submittedTotal}</div>
        <div>Approved: ₹{approvedTotal}</div>
      </div>

      <hr />

      {/* Upload */}
      <input type="file" onChange={handleUpload} />

      {/* Camera */}
      <div>
        <button onClick={startCamera}>Open Camera</button>
        <br />
        <video ref={videoRef} autoPlay width="300" />
        <br />
        <button onClick={capturePhoto}>Capture</button>
      </div>

      {/* Preview */}
      {image && (
        <div>
          <h4>Preview</h4>
          <img src={image} width="200" />
        </div>
      )}

      {/* OCR Form */}
      {ocrData && (
        <div>
          <h4>Edit Expense</h4>

          <input
            placeholder="Description"
            value={ocrData.description}
            onChange={(e) =>
              setOcrData({ ...ocrData, description: e.target.value })
            }
          />

          <input
            placeholder="Amount"
            value={ocrData.amount}
            onChange={(e) =>
              setOcrData({ ...ocrData, amount: e.target.value })
            }
          />

          <input
            placeholder="Date"
            value={ocrData.date}
            onChange={(e) =>
              setOcrData({ ...ocrData, date: e.target.value })
            }
          />

          <input
            placeholder="Category"
            value={ocrData.category}
            onChange={(e) =>
              setOcrData({ ...ocrData, category: e.target.value })
            }
          />

          <button onClick={saveExpense}>Save</button>
        </div>
      )}

      <hr />

      {/* Table */}
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Description</th>
            <th>Date</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((e, i) => (
            <tr key={i}>
              <td>{e.employee}</td>
              <td>{e.description}</td>
              <td>{e.date}</td>
              <td>{e.category}</td>
              <td>₹{e.amount}</td>
              <td>{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}