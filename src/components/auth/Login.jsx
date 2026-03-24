import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./authStyles.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password },
      );
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="authPageWrapper">
      <div className="authFormContainer">
        <h2 className="authTitle">Login</h2>
        <input
          className="authInputField"
          placeholder="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="authInputField"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="authPrimaryButton"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <p className="authSwitchText">
          Don't have an account?{" "}
          <Link to="/register" className="authSwitchLink">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
