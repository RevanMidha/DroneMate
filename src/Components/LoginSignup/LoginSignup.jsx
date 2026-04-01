import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { 
    auth, 
    db,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail,
    doc,
    setDoc,
    collection,
    getDocs,
    query,
    where
} from "../../firebase.js";

const LoginSignup = () => {
    const [action, setAction] = useState("Login");
    const [username, setUsername] = useState("");
    const [loginId, setLoginId] = useState(""); // can be email or username
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Auto-clear toast after 4 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (localStorage.getItem("isLoggedIn") === "true") {
            navigate("/dashboard");
        }
    }, [navigate]);

    const toggleAction = (e) => {
        e.preventDefault();
        setToast(null);
        setAction((prev) => (prev === "Login" ? "Register" : "Login"));
    };

    // Look up email by username in Firestore
    const getEmailByUsername = async (usernameInput) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", usernameInput.toLowerCase()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return null;
        }

        return snapshot.docs[0].data().email;
    };

    // REGISTER — saves username + email to Firestore
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check if username is already taken
            const existingEmail = await getEmailByUsername(username);
            if (existingEmail) {
                setToast({ type: "error", message: "Username is already taken. Try another one." });
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save username → email mapping in Firestore
            await setDoc(doc(db, "users", user.uid), {
                username: username.toLowerCase(),
                email: user.email,
                createdAt: new Date().toISOString()
            });

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userEmail", user.email);
            localStorage.setItem("username", username);
            setToast({ type: "success", message: "Account created successfully!" });
            setTimeout(() => navigate("/dashboard"), 800);
        } catch (error) {
            console.error("Error during registration:", error.message);
            setToast({ type: "error", message: error.message });
        }
        setLoading(false);
    };

    // LOGIN — supports both email and username
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let emailToUse = loginId;

            // If input doesn't look like an email, treat it as a username
            if (!loginId.includes("@")) {
                const foundEmail = await getEmailByUsername(loginId);
                if (!foundEmail) {
                    setToast({ type: "error", message: "No account found with that username." });
                    setLoading(false);
                    return;
                }
                emailToUse = foundEmail;
            }

            const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);
            const user = userCredential.user;
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userEmail", user.email);
            setToast({ type: "success", message: "Login successful!" });
            setTimeout(() => navigate("/dashboard"), 800);
        } catch (error) {
            console.error("Error during login:", error.message);
            setToast({ type: "error", message: "Invalid credentials. Check your email/username and password." });
        }
        setLoading(false);
    };

    // FORGOT PASSWORD — requires email (Firebase needs it)
    const handleForgotPassword = async (e) => {
        e.preventDefault();

        // If loginId looks like username, try to resolve it
        let resetEmail = loginId;
        if (loginId && !loginId.includes("@")) {
            const foundEmail = await getEmailByUsername(loginId);
            if (foundEmail) {
                resetEmail = foundEmail;
            } else {
                setToast({ type: "error", message: "No account found with that username. Enter your email instead." });
                return;
            }
        }

        if (!resetEmail || !resetEmail.includes("@")) {
            setToast({ type: "error", message: "Enter your email or username above, then click Forgot Password." });
            return;
        }

        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setToast({ type: "success", message: `Password reset email sent to ${resetEmail}! Check your inbox (and spam).` });
        } catch (error) {
            console.error("Error sending reset email:", error.message);
            setToast({ type: "error", message: error.message });
        }
    };

    return (
        <div className="login-page">
            <div className="wrapper">
                {/* Welcome Text */}
                <div className="welcome-text">
                    <h1>Welcome To DroneMate</h1>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={`toast-message ${toast.type}`}>
                        {toast.message}
                    </div>
                )}

                {action === "Login" ? (
                    <form onSubmit={handleLogin}>
                        <h1>Login</h1>

                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Email or Username"
                                required
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                            />
                            <FaUser className="icon" />
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <FaLock className="icon" />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Signing in..." : "Login"}
                        </button>

                        <div className="remember-forgot">
                            <button type="button" onClick={handleForgotPassword}>
                                Forgot Password?
                            </button>
                        </div>

                        <div className="register-link">
                            <p>
                                Don't have an account?{" "}
                                <button type="button" onClick={toggleAction}>
                                    Register
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleRegister}>
                        <h1>Register</h1>

                        <div className="input-box">
                            <input
                                type="text"
                                placeholder="Username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <FaUser className="icon" />
                        </div>

                        <div className="input-box">
                            <input
                                type="email"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <FaEnvelope className="icon" />
                        </div>

                        <div className="input-box">
                            <input
                                type="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <FaLock className="icon" />
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Register"}
                        </button>

                        <div className="register-link">
                            <p>
                                Already have an account?{" "}
                                <button type="button" onClick={toggleAction}>
                                    Login
                                </button>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginSignup;
