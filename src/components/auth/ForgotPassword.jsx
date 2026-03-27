import { useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { Link } from "react-router-dom";
import "./authStyles.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
        { email },
      );

      const resetLink = res.data.resetLink;
      console.log("Reset link:", resetLink);
      console.log("EmailJS config:", {
        serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID,
        templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
      });

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          reset_link: resetLink,
          company_name: "Tropical Shellfish",
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY,
      );

      setSent(true);
    } catch (err) {
      console.error("Full error:", err);
      console.error("Response:", err.response);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong: " + JSON.stringify(err),
      );
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (sent) {
    return (
      <div className="authPageWrapper">
        <div className="authFormContainer">
          <div className="authSuccessIcon">✅</div>
          <h2 className="authTitle">Check your email</h2>
          <p className="authSubtitle">
            A password reset link has been sent to <strong>{email}</strong>.
            Check your inbox and click the link to reset your password.
          </p>
          <p
            className="authSubtitle"
            style={{ fontSize: "12px", marginTop: "8px" }}
          >
            Didn't receive it? Check your spam folder.
          </p>
          <Link
            to="/"
            className="authPrimaryButton"
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "20px",
              textDecoration: "none",
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="authPageWrapper">
      <div className="authFormContainer">
        <h2 className="authTitle">Forgot Password</h2>
        <p className="authSubtitle">
          Enter your email and we'll send you a reset link.
        </p>
        <input
          className="authInputField"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="authPrimaryButton"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
        <p className="authSwitchText">
          Remembered your password?{" "}
          <Link to="/" className="authSwitchLink">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
