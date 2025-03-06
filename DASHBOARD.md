# Reveal.js Presentation Dashboard

This custom dashboard allows you to organize and access your Markdown presentations from an external directory.

## Setup

1. Install the required dependencies:
   ```
   npm install
   ```

2. Configure your presentations directory:
   - Open `presentation-server.js`
   - Edit the `presentationsDir` setting in the CONFIG object to point to your external presentations folder
   - Default: `../markdown-presentations` (relative to the reveal.js folder)

3. Create your markdown presentations:
   - Create `.md` files in your presentations directory
   - Filenames will be used as presentation titles (e.g., `my-awesome-talk.md` becomes "My Awesome Talk")
   - Use standard reveal.js markdown formatting:
     - Horizontal slides are separated by `---`
     - Vertical slides are separated by `--`
     - Speaker notes start with `Note:`

## Usage

1. Start the dashboard server:
   ```
   npm run dashboard
   ```

2. Open http://localhost:8000 in your browser to see the dashboard

3. Click on any presentation to view it

## Markdown Format

Your presentations should follow the reveal.js markdown format. Here's a basic example:

```markdown
# My Presentation Title

First slide content

---

## Second Slide

- Bullet points
- More points

Note: These are speaker notes that only show in presenter view

---

## Code Example

```javascript
function hello() {
  return "Hello World!";
}
```

---

## Vertical Slides

This is the top slide

--

And this appears below it when you press down
```

## Customization

- Edit `dashboard.html` to customize the dashboard layout and styling
- Edit `presentation-template.html` to change how presentations are rendered

## Additional Information

- The dashboard caches presentation data for 5 minutes for better performance
- All presentation files are served directly from your external directory
- Changes to markdown files are detected automatically when viewing the dashboard

For more information about reveal.js markdown features, see the [reveal.js documentation](https://revealjs.com/markdown/).