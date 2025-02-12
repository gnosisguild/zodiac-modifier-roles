export const GET = async (
  req: Request,
  { params }: { params: { record: string; token: string } }
) => {
  const html = `
      <html>
        <body>
          <script>
            localStorage.setItem('authToken:${params.record}', '${params.token}');
            window.location.href = '../'; // Redirect to the record page
          </script>
        </body>
      </html>
    `

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
    status: 200,
  })
}
