# Keyuri Tatu portfolio

Static site hosted on Cloudflare Pages, with a chatbot at `functions/api/chat.js`.

## Edit
- Pages are plain HTML in the root folder. Styles are in `style.css`.
- Images and videos live in `media/`. Use WebP for images and MP4/WebM for animation, not GIF.
- The chatbot only knows what is written in `functions/api/chat.js`. Add facts there.

## Deploy
Push to GitHub. Cloudflare Pages redeploys automatically (no build command, output directory `/`).
The chatbot needs the `ANTHROPIC_API_KEY` secret in Cloudflare: Pages project > Settings > Variables and Secrets.
Never put the key in code or commit it.
