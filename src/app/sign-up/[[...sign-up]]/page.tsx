import { SignIn } from "@clerk/nextjs";

export default function SignUpPage() {
  // 使用SignIn组件处理登录和注册流程
  // SignIn组件默认支持在登录和注册之间切换
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn fallbackRedirectUrl="/dash" />
    </div>
  );
}
