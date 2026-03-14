import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./authStyles.css";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [position, setPosition] = useState("");

  const handleRegister = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        name,
        email,
        password,
        position,
      });

      navigate("/login");
    } catch (err) {
      alert("Registration failed");
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
          onChange={(e) => setPosition(e.target.value)}
        >
          <option value="">Select Position</option>
          <option value="admin">Admin</option>
          <option value="director">Director</option>
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
          <option value="qc">QC</option>
        </select>

        <button className="authPrimaryButton" onClick={handleRegister}>
          Register
        </button>

        <p className="authSwitchText">
          Already have an account ?
          <Link to="/" className="authSwitchLink">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
