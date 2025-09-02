# Builder.io Setup Guide for Accounting Firm Website

This guide outlines the steps to set up the Builder.io space and configure the necessary CMS models for the accounting firm website. Since direct interaction with Builder.io is not possible in this environment, these steps are provided as instructions for manual setup.

## 1. Create a New Builder.io Space

1.  Log in to your Builder.io account.
2.  Navigate to the "Spaces" section (usually found in the top-left dropdown menu).
3.  Click on "Create New Space" or a similar option.
4.  Give your space a descriptive name, e.g., "Accounting Firm Website" or "Manus Accounting Demo".
5.  Select the appropriate region and other initial settings.

## 2. Configure CMS Models

We need to create three main CMS models: `Post`, `Service`, and `Global`.

### 2.1. Model: `Post` (for Blog Posts)

This model will manage the content for the blog section of the website. It should include fields for multilingual support and SEO.

**Model Type:** Content (or similar, depending on Builder.io's latest terminology)

**Fields:**

*   **`title`**: Text (Localized - enable localization for EN, AR, HI)
    *   *Description*: The title of the blog post.
*   **`slug`**: Text (Unique, Non-localized)
    *   *Description*: A URL-friendly identifier for the post (e.g., `how-to-save-on-taxes`).
*   **`excerpt`**: Rich Text (Localized)
    *   *Description*: A short summary or preview of the blog post.
*   **`body`**: Rich Text (Localized)
    *   *Description*: The main content of the blog post.
*   **`coverImage`**: Image (Non-localized)
    *   *Description*: The main image displayed at the top of the blog post.
*   **`tags`**: Text (Array/List, Non-localized)
    *   *Description*: Keywords or categories for the blog post (e.g., `taxes`, `small-business`).
*   **`author`**: Reference (to a `User` model if available, or Text for author name)
    *   *Description*: The author of the blog post.
*   **`publishedAt`**: Date/Time (Non-localized)
    *   *Description*: The date and time the post was published.
*   **`seoMetaTitle`**: Text (Localized)
    *   *Description*: Meta title for SEO purposes.
*   **`seoMetaDescription`**: Text (Localized)
    *   *Description*: Meta description for SEO purposes.
*   **`seoOgImage`**: Image (Non-localized)
    *   *Description*: Open Graph image for social media sharing.

### 2.2. Model: `Service` (for Accounting Services)

This model will define the various accounting services offered by the firm.

**Model Type:** Content

**Fields:**

*   **`title`**: Text (Localized)
    *   *Description*: The name of the service (e.g., `Bookkeeping`, `Tax Preparation`).
*   **`slug`**: Text (Unique, Non-localized)
    *   *Description*: A URL-friendly identifier for the service.
*   **`description`**: Rich Text (Localized)
    *   *Description*: A detailed description of the service.
*   **`deliverables`**: Rich Text (Array/List, Localized)
    *   *Description*: A checklist of what clients receive with this service.
*   **`whoItsFor`**: Rich Text (Localized)
    *   *Description*: Description of the target audience for this service.
*   **`typicalTimelines`**: Text (Localized)
    *   *Description*: Estimated duration or timeline for the service.
*   **`startingPrice`**: Number (Non-localized)
    *   *Description*: The starting price for the service.
*   **`faq`**: JSON (Localized - store an array of objects `{question: string, answer: string}`)
    *   *Description*: Frequently asked questions related to the service.
*   **`heroImage`**: Image (Non-localized)
    *   *Description*: An image representing the service.
*   **`seoMetaTitle`**: Text (Localized)
    *   *Description*: Meta title for SEO purposes.
*   **`seoMetaDescription`**: Text (Localized)
    *   *Description*: Meta description for SEO purposes.

### 2.3. Model: `Global` (for Navigation and Footer Content)

This model will store global content like header navigation links, footer details, and contact information, which are consistent across the site but need to be multilingual.

**Model Type:** Single Entry (or similar, for content that only has one instance)

**Fields:**

*   **`headerLogo`**: Image (Non-localized)
    *   *Description*: The logo displayed in the header.
*   **`navLinks`**: JSON (Localized - store an array of objects `{label: string, url: string}`)
    *   *Description*: Navigation links for the header (e.g., `Home`, `About`, `Services`).
*   **`bookConsultationCta`**: Text (Localized)
    *   *Description*: Text for the primary CTA button in the header.
*   **`footerQuickLinks`**: JSON (Localized - similar to `navLinks`)
    *   *Description*: Quick links for the footer.
*   **`officeAddress`**: Text (Localized)
    *   *Description*: The firm's office address.
*   **`phoneNumber`**: Text (Non-localized)
    *   *Description*: The firm's contact phone number.
*   **`socialIcons`**: JSON (Non-localized - store an array of objects `{platform: string, url: string, icon: image}`)
    *   *Description*: URLs for social media profiles (Facebook, X/Twitter, LinkedIn).
*   **`newsletterSignupText`**: Rich Text (Localized)
    *   *Description*: Text for the newsletter signup section in the footer.
*   **`officeHours`**: Text (Localized)
    *   *Description*: The firm's office hours.

## 3. Configure Locales

In Builder.io's settings (usually under "Localization" or "Languages"), add the following locales:

*   `en` (English - default)
*   `ar` (Arabic - mark as RTL)
*   `hi` (Hindi)

Ensure that for fields marked as "Localized" above, you enable translations for these three locales within the Builder.io interface. Builder.io's visual editor should allow for easy switching between locales to manage content.

## Next Steps

Once these models are configured, you can start populating them with content and then proceed to build the pages and components using Builder.io's visual editor, linking them to these CMS models.

