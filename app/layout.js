import './globals.css';

export const metadata = {
  title: 'Withstady Tutor',
  description: 'Ask homework questions and review chat history with an AI tutor powered by Groq.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
