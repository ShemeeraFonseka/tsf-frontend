import { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "./authStyles.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      alert("Please fill in both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    if (!token || !email) {
      alert("Invalid reset link.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        { email, token, newPassword },
      );
      setDone(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      alert(
        err.response?.data?.message || "Reset failed. Link may have expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleReset();
  };

  if (!token || !email) {
    return (
      <div className="authPageWrapper">
        <div className="authFormContainer">
          <div className="authSuccessIcon">❌</div>
          <h2 className="authTitle">Invalid Link</h2>
          <p className="authSubtitle">
            This reset link is invalid or malformed.
          </p>
          <Link
            to="/"
            className="authPrimaryButton"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="authPageWrapper">
        <div className="authFormContainer">
          <div className="authSuccessIcon">✅</div>
          <h2 className="authTitle">Password Reset!</h2>
          <p className="authSubtitle">
            Your password has been updated. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="authPageWrapper">
      <div className="authFormContainer">
        <h2 className="authTitle">Reset Password</h2>
        <p className="authSubtitle">Enter your new password below.</p>
        <input
          className="authInputField"
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <input
          className="authInputField"
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="authPrimaryButton"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
        <p className="authSwitchText">
          <Link to="/" className="authSwitchLink">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
