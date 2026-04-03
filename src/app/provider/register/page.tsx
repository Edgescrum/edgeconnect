import { RegisterWizard } from "./register-wizard";

export default function RegisterPage() {
  // 認証はLiffProvider（クライアント側）で管理
  // RegisterWizard内でuseLiff()のisLoggedInをチェック
  return <RegisterWizard />;
}
