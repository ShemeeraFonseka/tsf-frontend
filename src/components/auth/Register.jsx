import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./authStyles.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!name || !email || !password || !position) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        name,
        email,
        password,
        position,
      });
      alert("Account created successfully!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPageWrapper">
      <div className="authFormContainer">
        <h2 className="authTitle">Create Account</h2>

        <input
          className="authInputField"
          placeholder="Full Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="authInputField"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="authInputField"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="authInputField"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="">Select Position</option>
          <option value="admin">Admin</option>
          <option value="director">Director</option>
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
          <option value="qc">QC</option>
        </select>

        {position === "sales" && (
          <p
            style={{
              fontSize: "12px",
              color: "#8899bb",
              margin: "-8px 0 8px",
              textAlign: "center",
            }}
          >
            👁️ Sales accounts have view-only access
          </p>
        )}

        <button
          className="authPrimaryButton"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Creating…" : "Register"}
        </button>

        <p className="authSwitchText">
          Already have an account?{" "}
          <Link to="/" className="authSwitchLink">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
