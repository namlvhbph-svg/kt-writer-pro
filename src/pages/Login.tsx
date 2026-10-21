import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Library,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Tags,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HIGHLIGHTS = [
  {
    icon: Library,
    title: "Kho văn bản pháp luật",
    description: "Cào tự động theo nguồn cấu hình hoặc tải file PDF, DOCX, TXT vào kho.",
  },
  {
    icon: Tags,
    title: "Thư viện từ khóa chủ đề",
    description: "Theo dõi từ khóa kế toán – thuế, gắn nhóm chủ đề và mức ưu tiên.",
  },
  {
    icon: FileText,
    title: "Kho bài viết & biên tập",
    description: "Soạn markdown, gắn văn bản nguồn, duyệt bài và xuất file.",
  },
];

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập không thành công.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const { needsEmailConfirm } = await signUp(
        email.trim(),
        password,
        fullName.trim(),
      );
      if (needsEmailConfirm) {
        setNotice(
          "Tài khoản đã được tạo. Hãy kiểm tra email để xác nhận rồi đăng nhập.",
        );
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký không thành công.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-full w-full lg:grid-cols-[1.05fr_1fr]">
      <section className="sidebar-gradient relative hidden flex-col justify-between p-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Library className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-sidebar-accent-foreground">
              KT Writer PRO
            </p>
            <p className="text-xs text-sidebar-foreground/70">
              Kho dữ liệu kế toán &amp; thuế
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-8">
          <h1 className="text-3xl font-semibold leading-snug text-sidebar-accent-foreground">
            Một chỗ cho văn bản pháp luật, từ khóa chủ đề và bài viết chuyên môn.
          </h1>
          <ul className="space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-sidebar-accent-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed text-sidebar-foreground/70">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Dữ liệu nội bộ, chỉ thành viên đã đăng nhập truy cập được.
        </p>
      </section>

      <section className="surface-gradient flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">KT Writer PRO</p>
              <p className="text-xs text-muted-foreground">
                Kho dữ liệu kế toán &amp; thuế
              </p>
            </div>
          </div>

          <Card className="card-shadow border-border/70">
            <CardContent className="p-6 sm:p-7">
              <Tabs defaultValue="login" className="space-y-5">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Đăng nhập</TabsTrigger>
                  <TabsTrigger value="signup">Đăng ký</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field
                      id="login-email"
                      label="Email"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="ten@congty.vn"
                      autoComplete="email"
                    />
                    <Field
                      id="login-password"
                      label="Mật khẩu"
                      icon={LockKeyhole}
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Mật khẩu của bạn"
                      autoComplete="current-password"
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || !email || !password}
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Đăng nhập
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <Field
                      id="signup-name"
                      label="Họ và tên"
                      icon={User}
                      value={fullName}
                      onChange={setFullName}
                      placeholder="Nguyễn Văn A"
                      autoComplete="name"
                    />
                    <Field
                      id="signup-email"
                      label="Email công việc"
                      icon={Mail}
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="ten@congty.vn"
                      autoComplete="email"
                    />
                    <Field
                      id="signup-password"
                      label="Mật khẩu"
                      icon={LockKeyhole}
                      type="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Tối thiểu 6 ký tự"
                      autoComplete="new-password"
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting || !email || password.length < 6}
                    >
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Tạo tài khoản
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {error && (
                <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              {notice && (
                <p className="mt-4 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                  {notice}
                </p>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground">
            Chỉ dành cho thành viên nội bộ phụ trách nội dung kế toán – thuế.
          </p>
        </div>
      </section>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
};

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pl-9"
        />
      </div>
    </div>
  );
}
