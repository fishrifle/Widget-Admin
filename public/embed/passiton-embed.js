/**
 * PassItOn Universal Embed Script
 * Use this for any website that doesn't have WordPress or Drupal modules
 * 
 * Usage:
 * <script src="https://your-domain.com/embed/passiton-embed.js"></script>
 * <div data-passiton-widget="your-widget-slug" data-style="inline"></div>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    domain: 'your-domain.com', // Replace with your actual domain
    version: '1.0.0'
  };

  // Utility functions
  const utils = {
    generateId: () => 'passiton-widget-' + Math.random().toString(36).substr(2, 9),
    
    getConfig: (element) => ({
      slug: element.getAttribute('data-passiton-widget'),
      style: element.getAttribute('data-style') || 'inline',
      width: element.getAttribute('data-width') || '100%',
      height: element.getAttribute('data-height') || '600px',
      buttonText: element.getAttribute('data-button-text') || 'Donate Now',
      domain: element.getAttribute('data-domain') || CONFIG.domain
    }),
    
    createElement: (tag, attributes = {}, styles = {}) => {
      const el = document.createElement(tag);
      Object.entries(attributes).forEach(([key, value]) => el.setAttribute(key, value));
      Object.entries(styles).forEach(([key, value]) => el.style[key] = value);
      return el;
    },
    
    addCSS: (css) => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  };

  // CSS Styles
  const CSS = `
    .passiton-widget-container {
      margin: 20px 0;
      position: relative;
    }

    .passiton-donate-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .passiton-donate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .passiton-modal {
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: none;
    }

    .passiton-modal.open {
      display: block;
    }

    .passiton-modal-content {
      position: relative;
      margin: 2% auto;
      width: 90%;
      max-width: 500px;
      height: 90%;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .passiton-close {
      position: absolute;
      top: 15px;
      right: 20px;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      z-index: 10001;
      color: #999;
      background: white;
      border-radius: 50%;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .passiton-close:hover {
      color: #333;
      background: #f5f5f5;
      transform: scale(1.1);
    }

    .passiton-sidebar-widget {
      position: fixed;
      right: -320px;
      top: 50%;
      transform: translateY(-50%);
      width: 300px;
      height: 500px;
      background: white;
      border-radius: 12px 0 0 12px;
      box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      transition: right 0.3s ease;
      overflow: hidden;
    }

    .passiton-sidebar-widget.open {
      right: 0;
    }

    .passiton-sidebar-tab {
      position: absolute;
      left: -50px;
      top: 50%;
      transform: translateY(-50%) rotate(-90deg);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 10px 20px;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-weight: 600;
      white-space: nowrap;
      user-select: none;
      transition: all 0.2s ease;
      box-shadow: -2px -2px 8px rgba(0, 0, 0, 0.1);
    }

    .passiton-sidebar-tab:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%);
      transform: translateY(-50%) rotate(-90deg) scale(1.05);
    }

    @media (max-width: 768px) {
      .passiton-modal-content {
        width: 95%;
        height: 95%;
        margin: 2.5% auto;
      }
      
      .passiton-sidebar-widget {
        width: 280px;
        right: -300px;
      }
    }

    @media (max-width: 480px) {
      .passiton-donate-btn {
        padding: 10px 20px;
        font-size: 14px;
      }
      
      .passiton-sidebar-widget {
        width: 100%;
        right: -100%;
        border-radius: 0;
      }
      
      .passiton-sidebar-tab {
        left: -45px;
        padding: 8px 16px;
        font-size: 14px;
      }
    }

    .passiton-widget-iframe {
      border: none;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
  `;

  // Widget renderers
  const renderers = {
    inline: (config, widgetId) => {
      const container = utils.createElement('div', {
        id: widgetId,
        class: 'passiton-widget-container'
      }, {
        width: config.width,
        height: config.height
      });

      const iframe = utils.createElement('iframe', {
        src: `https://${config.domain}/widget/${config.slug}`,
        width: '100%',
        height: '100%',
        frameborder: '0',
        title: 'PassItOn Donation Widget',
        loading: 'lazy',
        class: 'passiton-widget-iframe'
      });

      container.appendChild(iframe);
      return container;
    },

    modal: (config, widgetId) => {
      const container = utils.createElement('div', { class: 'passiton-modal-trigger' });
      
      const button = utils.createElement('button', {
        id: `${widgetId}-trigger`,
        class: 'passiton-donate-btn'
      });
      button.innerHTML = `💝 ${config.buttonText}`;
      
      const modal = utils.createElement('div', {
        id: `${widgetId}-modal`,
        class: 'passiton-modal'
      });
      
      const modalContent = utils.createElement('div', { class: 'passiton-modal-content' });
      
      const closeBtn = utils.createElement('span', { class: 'passiton-close' });
      closeBtn.innerHTML = '&times;';
      
      const iframe = utils.createElement('iframe', {
        src: `https://${config.domain}/widget/${config.slug}`,
        width: '100%',
        height: '100%',
        frameborder: '0',
        title: 'PassItOn Donation Widget',
        loading: 'lazy'
      });
      
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(iframe);
      modal.appendChild(modalContent);
      container.appendChild(button);
      container.appendChild(modal);
      
      return container;
    },

    sidebar: (config, widgetId) => {
      const sidebar = utils.createElement('div', {
        id: `${widgetId}-sidebar`,
        class: 'passiton-sidebar-widget'
      });
      
      const tab = utils.createElement('div', { class: 'passiton-sidebar-tab' });
      tab.innerHTML = '💝 Donate';
      
      const iframe = utils.createElement('iframe', {
        src: `https://${config.domain}/widget/${config.slug}`,
        width: '100%',
        height: '100%',
        frameborder: '0',
        title: 'PassItOn Donation Widget',
        loading: 'lazy'
      });
      
      sidebar.appendChild(tab);
      sidebar.appendChild(iframe);
      
      return sidebar;
    }
  };

  // Event handlers
  const handlers = {
    setupModal: (widgetId) => {
      const button = document.getElementById(`${widgetId}-trigger`);
      const modal = document.getElementById(`${widgetId}-modal`);
      const closeBtn = modal.querySelector('.passiton-close');
      
      button.addEventListener('click', () => {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
      
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        document.body.style.overflow = 'auto';
      });
      
      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
          document.body.style.overflow = 'auto';
        }
      });
      
      document.addEventListener('keyup', (e) => {
        if (e.keyCode === 27 && modal.classList.contains('open')) {
          modal.classList.remove('open');
          document.body.style.overflow = 'auto';
        }
      });
    },

    setupSidebar: (widgetId) => {
      const sidebar = document.getElementById(`${widgetId}-sidebar`);
      const tab = sidebar.querySelector('.passiton-sidebar-tab');
      
      tab.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }
  };

  // Main initialization
  const PassItOnEmbed = {
    init: () => {
      // Add CSS
      utils.addCSS(CSS);
      
      // Find all widget elements
      const widgets = document.querySelectorAll('[data-passiton-widget]');
      
      widgets.forEach(element => {
        const config = utils.getConfig(element);
        
        if (!config.slug) {
          element.innerHTML = '<p style="color: red;">Error: data-passiton-widget attribute is required</p>';
          return;
        }
        
        const widgetId = utils.generateId();
        const renderer = renderers[config.style] || renderers.inline;
        const widget = renderer(config, widgetId);
        
        // Replace the original element with the widget
        if (config.style === 'sidebar') {
          document.body.appendChild(widget);
        } else {
          element.appendChild(widget);
        }
        
        // Setup event handlers
        switch (config.style) {
          case 'modal':
            handlers.setupModal(widgetId);
            break;
          case 'sidebar':
            handlers.setupSidebar(widgetId);
            break;
        }
      });
      
      // Setup cross-frame communication
      window.addEventListener('message', (e) => {
        const data = e.data;
        if (data && data.type === 'passiton-widget') {
          switch (data.action) {
            case 'close':
              document.querySelectorAll('.passiton-modal').forEach(modal => {
                modal.classList.remove('open');
              });
              document.querySelectorAll('.passiton-sidebar-widget').forEach(sidebar => {
                sidebar.classList.remove('open');
              });
              document.body.style.overflow = 'auto';
              break;
            case 'resize':
              if (data.height && data.widgetId) {
                const iframe = document.querySelector(`iframe[src*="${data.widgetId}"]`);
                if (iframe) {
                  iframe.style.height = data.height + 'px';
                }
              }
              break;
          }
        }
      });
    },
    
    // Manual widget creation
    create: (selector, options = {}) => {
      const element = document.querySelector(selector);
      if (!element) return;
      
      const config = {
        slug: options.slug,
        style: options.style || 'inline',
        width: options.width || '100%',
        height: options.height || '600px',
        buttonText: options.buttonText || 'Donate Now',
        domain: options.domain || CONFIG.domain
      };
      
      if (!config.slug) {
        element.innerHTML = '<p style="color: red;">Error: Widget slug is required</p>';
        return;
      }
      
      const widgetId = utils.generateId();
      const renderer = renderers[config.style] || renderers.inline;
      const widget = renderer(config, widgetId);
      
      if (config.style === 'sidebar') {
        document.body.appendChild(widget);
        handlers.setupSidebar(widgetId);
      } else {
        element.appendChild(widget);
        if (config.style === 'modal') {
          handlers.setupModal(widgetId);
        }
      }
      
      return widgetId;
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', PassItOnEmbed.init);
  } else {
    PassItOnEmbed.init();
  }

  // Expose to global scope
  window.PassItOnEmbed = PassItOnEmbed;

})();