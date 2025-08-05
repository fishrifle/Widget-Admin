# PassItOn Widget Embed Guide

This guide shows you how to embed PassItOn donation widgets in WordPress, Drupal, and any other website.

## 🔧 Quick Setup

Replace `your-domain.com` with your actual PassItOn domain in all the files.

---

## 📱 WordPress Integration

### Method 1: Plugin Installation

1. **Upload the Plugin**
   - Download `wordpress-plugin.php`
   - Upload to `/wp-content/plugins/passiton-widget/passiton-widget.php`
   - Activate in WordPress Admin → Plugins

2. **Configure Settings**
   - Go to Settings → PassItOn Widget
   - Enter your domain (e.g., `your-domain.com`)
   - Save settings

3. **Use Shortcodes**
   ```
   [passiton_widget slug="your-widget-slug"]
   [passiton_widget slug="your-widget-slug" style="modal"]
   [passiton_widget slug="your-widget-slug" style="sidebar"]
   [passiton_widget slug="your-widget-slug" width="400px" height="500px"]
   ```

### Method 2: Manual HTML (WordPress)

Add this to your theme's `functions.php`:

```php
function add_passiton_embed_script() {
    wp_enqueue_script('passiton-embed', 'https://your-domain.com/embed/passiton-embed.js', array(), '1.0.0', true);
}
add_action('wp_enqueue_scripts', 'add_passiton_embed_script');
```

Then use HTML in posts/pages:
```html
<div data-passiton-widget="your-widget-slug" data-style="inline"></div>
```

---

## 🗂️ Drupal Integration

### Module Installation

1. **Upload Module**
   - Copy the entire `drupal-module/passiton_widget` folder to `/modules/custom/`

2. **Enable Module**
   - Go to Extend → Install modules
   - Enable "PassItOn Widget"

3. **Configure Domain**
   - Go to Configuration → PassItOn Widget Settings
   - Enter your domain

4. **Enable Text Filter**
   - Go to Configuration → Text formats
   - Edit your text formats (Basic HTML, Full HTML)
   - Enable "PassItOn Widget Token Filter"

### Usage in Drupal

**Content Tokens:**
```
[passiton-widget:your-widget-slug]
[passiton-widget:your-widget-slug:modal]
[passiton-widget:your-widget-slug:sidebar]
[passiton-widget:your-widget-slug:inline:400px:500px]
```

**Block Usage:**
- Go to Structure → Block layout
- Add "PassItOn Widget" block
- Configure widget slug and style

---

## 🌐 Universal JavaScript (Any Website)

### Simple Implementation

1. **Add the Script**
   ```html
   <script src="https://your-domain.com/embed/passiton-embed.js"></script>
   ```

2. **Add Widget HTML**
   ```html
   <!-- Inline Widget -->
   <div data-passiton-widget="your-widget-slug" data-style="inline"></div>
   
   <!-- Modal Widget -->
   <div data-passiton-widget="your-widget-slug" data-style="modal" data-button-text="Support Us"></div>
   
   <!-- Sidebar Widget -->
   <div data-passiton-widget="your-widget-slug" data-style="sidebar"></div>
   
   <!-- Custom Size -->
   <div data-passiton-widget="your-widget-slug" data-width="400px" data-height="500px"></div>
   ```

### Programmatic Usage

```javascript
// Create widget programmatically
PassItOnEmbed.create('#my-widget-container', {
  slug: 'your-widget-slug',
  style: 'modal',
  buttonText: 'Donate Now',
  domain: 'your-domain.com'
});
```

---

## 🎨 Widget Styles

### 1. Inline Widget
- Embeds directly in page content
- Customizable width and height
- Best for dedicated donation pages

### 2. Modal Widget  
- Shows as a button that opens a popup
- Overlay with backdrop blur
- Great for call-to-action buttons

### 3. Sidebar Widget
- Fixed position sliding tab
- Accessible from any page
- Perfect for persistent donation access

---

## 📋 Available Options

| Attribute | Description | Default | Example |
|-----------|-------------|---------|---------|
| `data-passiton-widget` | Widget slug (required) | - | `main-widget` |
| `data-style` | Widget style | `inline` | `modal`, `sidebar` |
| `data-width` | Widget width | `100%` | `400px` |
| `data-height` | Widget height | `600px` | `500px` |
| `data-button-text` | Modal button text | `Donate Now` | `Support Us` |
| `data-domain` | Your PassItOn domain | From config | `your-domain.com` |

---

## 🔧 Advanced Configuration

### Custom Styling

Override default styles by adding CSS:

```css
.passiton-donate-btn {
  background: #your-brand-color !important;
  border-radius: 15px !important;
}

.passiton-modal-content {
  max-width: 600px !important;
}
```

### Cross-Frame Communication

Widgets can send messages to the parent page:

```javascript
// Listen for widget events
window.addEventListener('message', (e) => {
  if (e.data.type === 'passiton-donation-complete') {
    console.log('Donation completed!');
    // Track analytics, show thank you message, etc.
  }
});
```

---

## 🚀 Demo Examples

### WordPress Demo
```
[passiton_widget slug="demo-widget" style="modal"]
```

### Drupal Demo
```
[passiton-widget:demo-widget:modal]
```

### HTML Demo
```html
<script src="https://your-domain.com/embed/passiton-embed.js"></script>
<div data-passiton-widget="demo-widget" data-style="modal" data-button-text="💝 Support Our Cause"></div>
```

---

## 🛠️ Troubleshooting

### Common Issues

1. **Widget not loading**
   - Check that domain is correctly configured
   - Verify widget slug exists
   - Check browser console for errors

2. **Styling conflicts**
   - Add `!important` to CSS overrides
   - Check for conflicting z-index values

3. **WordPress issues**
   - Ensure plugin is activated
   - Check that shortcodes are enabled in your theme

4. **Drupal issues**
   - Enable the text filter in your text formats
   - Clear cache after configuration changes

### Support

For technical support, check your widget admin dashboard or contact your PassItOn administrator.

---

## 📱 Mobile Responsiveness

All widget styles are fully responsive:
- Modal widgets adapt to screen size
- Sidebar widgets become full-width on mobile
- Inline widgets scale with container

---

Ready to start collecting donations! 🎉