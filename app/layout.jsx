export const metadata = {
  title: 'Make a Video',
  description: 'Generate a video in your browser',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif',
        background: '#0b0f19',
        color: '#e5e7eb',
      }}>
        {children}
      </body>
    </html>
  );
}
