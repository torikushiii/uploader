# Image Uploader

A modern, full-stack web application for image and video uploading, built with Astro and deployed on Cloudflare.

## 🚀 Technologies

- **[Astro](https://astro.build/)**: Core web framework
- **[Svelte](https://svelte.dev/)**: Used for interactive components
- **[TypeScript](https://www.typescriptlang.org/)**: For type-safe JavaScript
- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Serverless deployment platform
- **[Cloudflare KV](https://www.cloudflare.com/products/workers-kv/)**: Key-value storage
- **CSS**: Custom styling with animations
- **Service Worker**: Offline functionality and caching
- **[MDX](https://mdxjs.com/)**: Markdown with JSX support
- **Modern Web APIs**: Fetch, FormData, IntersectionObserver, etc.
- **LocalStorage**: Client-side data persistence
- **[ShareX](https://getsharex.com/)**: Integration for easy screenshot sharing
- **[Vite](https://vitejs.dev/)**: Build tooling

## 🌟 Features

- Image and video upload (up to 100MB)
- EXIF data stripping for images
- File preview before upload
- Gallery view of uploaded files
- Shareable links for uploads
- Deletion capability for uploaded files
- Rate limiting to prevent abuse
- Responsive design for various screen sizes
- Offline support

## 🛠 Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Configure your Cloudflare account and KV namespace
4. Set up environment variables
5. Run locally with `npm run dev`
6. Deploy to Cloudflare with `npm run deploy`

## 📚 API

The application provides a simple API for file uploads and deletions. Check the `/src/pages/api` directory for implementation details.

## 🔒 Security

- File size limits
- Rate limiting
- EXIF data removal from images

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/torikushiii/uploader/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen).

---
