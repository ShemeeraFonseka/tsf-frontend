import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./authStyles.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      navigate("/dashboard");
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="authPageWrapper">
      <div className="authFormContainer">
        <h2 className="authTitle">Login</h2>

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

        <button className="authPrimaryButton" onClick={handleLogin}>
          Sign In
        </button>

        <p className="authSwitchText">
          Don't have an account ?
          <Link to="/register" className="authSwitchLink">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
