This repo is used to host static HTML tools via GitHub pages from the main branch.

## Conventions
- All pages use pico css if not requested otherwise.
- Use semantic HTML elements, so Pico can ensure a consistent style across all pages.
- Before you add custom CSS to a page, check if you can use the generic css classes from `style.css` for styling and layout.
- Keep the layout of pages consistent across the repo, so users can easily navigate and use the tools without confusion.
- Pages are stored as index.html files in sub folders named after the tool that they implement.
- Layout and style of pages work on mobile and desktop.
- Each page is linked in the main index.html.
- Add new pages to PRECACHE_URLS in sw.j and increment the cache version
- Only use vanilla JavaScript if not requested otherwise. Inform the prompter about any library that you consider adding.
- Code should be clean, readable, consistent and commented on the block-level
- Pages use namespaced keys if they store data in localStorage
