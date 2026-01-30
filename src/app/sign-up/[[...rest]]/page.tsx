import { SignUp } from '@clerk/nextjs';

export default function Page() {
    return (
        <div className="auth-container">
            <SignUp />
            <style jsx global>{`
        .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
      `}</style>
        </div>
    );
}
