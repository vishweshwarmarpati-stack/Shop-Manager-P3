import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  loginApi,
} from "../../services/api";


function Login() {
  const navigate = useNavigate();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result =
        await loginApi({
          username: username.trim(),
          password,
        });

      localStorage.setItem(
        "snackflow_logged_in",
        "true",
      );

      localStorage.setItem(
        "snackflow_token",
        result.access_token,
      );

      localStorage.setItem(
        "snackflow_user",
        JSON.stringify({
          username: result.username,
          role: result.role,
          shop_id: result.shop_id,
        }),
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-page">

      <div
        className="
          login-background-decoration
          login-decoration-one
        "
      />

      <div
        className="
          login-background-decoration
          login-decoration-two
        "
      />


      <div className="login-container">

        <div className="login-card">

          <div className="login-brand">

            <div className="login-logo">
              <span>SF</span>
            </div>

            <div>
              <h1>
                SnackFlow
              </h1>

              <p>
                Smart shop management
              </p>
            </div>

          </div>


          <div className="login-heading">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to manage your shops,
              orders and sales.
            </p>

          </div>


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="login-field">

              <label htmlFor="username">
                Username
              </label>

              <div className="login-input-wrapper">

                <UserRound
                  size={18}
                  className="login-input-icon"
                />

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(
                      event.target.value,
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  required
                />

              </div>

            </div>


            <div className="login-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">

                <LockKeyhole
                  size={18}
                  className="login-input-icon"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {error && (
              <div
                className="login-error"
                role="alert"
              >

                <div className="login-error-icon">
                  !
                </div>

                <span>
                  {error}
                </span>

              </div>
            )}


            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spin">
                    <LogIn size={17} />
                  </span>

                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={17} />

                  Sign in to SnackFlow
                </>
              )}

            </button>

          </form>


          <div className="login-demo">

            <div className="login-demo-icon">
              <ShieldCheck size={17} />
            </div>

            <div className="login-demo-content">

              <strong>
                Secure workspace
              </strong>

              <span>
                Your SnackFlow account is
                protected with secure
                authentication.
              </span>

            </div>

          </div>


          <div className="login-footer">

            <LockKeyhole size={11} />

            <span>
              SnackFlow Management System
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Login;