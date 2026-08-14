# D.P. Accounting Solutions Website

Professional accounting services website with Greek tax calculator functionality.

## Project Structure

```
dpeconsolutions-site/
├── index.html              # Main homepage
├── consulting.html         # Consulting profile page
├── faq.html               # FAQ page
├── case-studies.html      # Case studies
├── funding.html           # Funding/grants information
├── privacy.html           # Privacy policy
├── thanks.html            # Thank you page (form submission)
├── 404.html               # Custom 404 page
├── styles.css             # Main stylesheet (v5.0)
├── styles-consulting.css  # Consulting page theme
├── script.js              # Main JavaScript (v5.0)
├── script-consulting.js   # Consulting page script
├── calculator-core.js     # Shared calculator logic (ES module)
├── sitemap.xml            # XML sitemap for SEO
├── robots.txt             # Search engine directives
└── assets/
    ├── logo-dp-gold.png   # Primary logo
    ├── favicon.svg        # Site favicon
    ├── og-image.jpg       # Open Graph image
    └── *.svg              # Service icons
```

## Features

### Tax Calculator
- Progressive tax calculation for Greek income tax
- Supports salary, business income, and rental income
- Child deduction credits with phased reduction
- Advance payment calculations
- Export to CSV and Print/PDF functionality

### Theme System
- 4 built-in themes: Dark, Greige, Grey, Light
- Automatic persistence via localStorage
- Theme selector in footer

### Meeting Booking
- Quick slot suggestions
- iCalendar (.ics) file generation
- Email notification via FormSubmit.co

## Local Development

Since the site uses standard JavaScript (no build step required), you can serve it locally:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

## Deployment

The site is deployed to GitHub Pages:

**Live URL:** https://lone-side.github.io/dpeconsolutions-site/

### Manual Deploy
1. Push changes to main branch
2. GitHub Pages automatically deploys from root

### Build for Production
```bash
# Optional: Run build script for minification
./build.sh
```

## Calculator Logic

The tax calculator implements Greek tax law:

### Income Tax Brackets (2024-2025)
| Income Range | Rate |
|-------------|------|
| 0 - 10,000 | 9% |
| 10,001 - 20,000 | 22% |
| 20,001 - 30,000 | 28% |
| 30,001 - 40,000 | 36% |
| 40,001+ | 44% |

### Child Credits
| Children | Credit |
|----------|--------|
| 0 | 0 |
| 1 | 900 |
| 2 | 1,120 |
| 3 | 1,340 |
| 4 | 1,580 |
| 5 | 1,780 |
| 6+ | +220/child |

Credits are reduced by 20 per 1,000 income above 12,000.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

Copyright D.P. Accounting Solutions. All rights reserved.

## Contact

- Email: dpeconsolutions@gmail.com
- Phone: +30 243 107 6222
