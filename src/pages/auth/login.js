import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { signin } from "@/services/authService";
import styles from "@/styles/Login.module.css";
import Button from "@/components/Button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = "Email é obrigatório.";
    if (!password) newErrors.password = "Senha é obrigatória.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const data = await signin({ email, password });
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
        window.location.href = "/";
      } else {
        setErrors({ general: "Resposta inesperada do servidor." });
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrors({ general: "Credenciais inválidas ou email não confirmado." });
      } else {
        setErrors({ general: "Erro ao tentar fazer login. Tente novamente." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.container} ${styles.loginPage}`}>
      <div className={styles.formSection}>
        <div className={styles.formBox}>
          
          {/* Logo adicionado aqui */}
          <div className={styles.logoContainer}>
            <Image
              src="/images/Logo-buffs.svg" // Ou o .png que preferir
              alt="Logo Buff's"
              width={150} // Ajuste o tamanho conforme necessário
              height={70} // Ajuste o tamanho conforme necessário
              priority
            />
          </div>

          <h1 className={styles.title}>Bem-Vindo!</h1>
          <p className={styles.description}>
            Faça login com os dados inseridos durante seu cadastro.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>

            {errors.general && (
              <div className={styles.error} style={{ marginBottom: 12 }}>{errors.general}</div>
            )}
            <div className={styles.inputGroup}>
              <input
                type="email"
                id="email"
                name="email"
                className={styles.input}
                placeholder=" "
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby="email-error"
                disabled={loading}
              />
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <span className={styles.icon} aria-hidden="true">
                <Image src="/images/icon_email.svg" alt="" width={20} height={20} />
              </span>
              {errors.email && (
                <span id="email-error" className={styles.error}>{errors.email}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                className={styles.input}
                placeholder=" "
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby="password-error"
                disabled={loading}
              />
              <label htmlFor="password" className={styles.label}>
                Senha
              </label>
              <button
                type="button"
                className={styles.icon}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                tabIndex={0}
                onClick={() => setShowPassword(v => !v)}
                disabled={loading}
                style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}
              >
                <Image
                  src={showPassword ? "/images/not-view-password.svg" : "/images/not-view-password-bloqued.svg"}
                  alt=""
                  width={20}
                  height={20}
                />
              </button>
              {errors.password && (
                <span id="password-error" className={styles.error}>{errors.password}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="full"
              className={styles.loginButton}
              aria-busy={loading}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Log in"}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>ou</span>
          </div>

          <Button
            type="button"
            variant="secondary"
            className={styles.googleCircleButton}
            disabled={loading}
            aria-label="Entrar com Google"
            style={{
              borderRadius: "50%",
              width: 44,
              height: 44,
              minWidth: 44,
              minHeight: 44,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Image 
              src="/images/google-icon.svg" 
              alt="Google" 
              className={styles.googleIcon}
              width={24}
              height={24}
            />
          </Button>

          <Link href="/auth/forgot-password" className={styles.forgotPassword}>
            Esqueci minha senha
          </Link>

          <p className={styles.signupLink}>
            Não tem uma conta? 
            <Link href="/auth/register" className={styles.link}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>

      {/* SEÇÃO DA IMAGEM (AGORA NA DIREITA) */}
      {/* Esta div agora servirá apenas como container para o background-image do CSS */}
      <div className={styles.imageSection}></div>
    </div>
  );
}