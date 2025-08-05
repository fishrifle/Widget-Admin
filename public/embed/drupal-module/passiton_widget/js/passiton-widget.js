(function ($, Drupal) {
  'use strict';

  /**
   * PassItOn Widget functionality.
   */
  Drupal.behaviors.passItOnWidget = {
    attach: function (context, settings) {
      
      // Modal functionality
      $('.passiton-modal-trigger button', context).once('passiton-modal').on('click', function() {
        var modalId = $(this).attr('id').replace('-trigger', '-modal');
        $('#' + modalId).show().addClass('open');
        $('body').css('overflow', 'hidden'); // Prevent body scroll
      });
      
      $('.passiton-close', context).once('passiton-close').on('click', function() {
        $(this).closest('.passiton-modal').hide().removeClass('open');
        $('body').css('overflow', 'auto'); // Restore body scroll
      });
      
      // Close modal when clicking outside
      $(window).on('click', function(e) {
        if ($(e.target).hasClass('passiton-modal')) {
          $(e.target).hide().removeClass('open');
          $('body').css('overflow', 'auto');
        }
      });
      
      // Close modal with ESC key
      $(document).on('keyup', function(e) {
        if (e.keyCode === 27) { // ESC key
          $('.passiton-modal').hide().removeClass('open');
          $('body').css('overflow', 'auto');
        }
      });
      
      // Sidebar functionality
      $('.passiton-sidebar-tab', context).once('passiton-sidebar').on('click', function() {
        var sidebar = $(this).parent();
        var isOpen = sidebar.hasClass('open');
        
        if (isOpen) {
          sidebar.removeClass('open');
        } else {
          sidebar.addClass('open');
        }
      });
      
      // Close sidebar when clicking outside
      $(document).on('click', function(e) {
        if (!$(e.target).closest('.passiton-sidebar-widget').length) {
          $('.passiton-sidebar-widget').removeClass('open');
        }
      });
      
      // Handle iframe communication (optional)
      $(window).on('message', function(e) {
        var data = e.originalEvent.data;
        if (data && data.type === 'passiton-widget') {
          switch (data.action) {
            case 'close':
              // Close modal or sidebar if widget requests it
              $('.passiton-modal').hide().removeClass('open');
              $('.passiton-sidebar-widget').removeClass('open');
              $('body').css('overflow', 'auto');
              break;
            case 'resize':
              // Handle widget resize requests
              if (data.height) {
                var iframe = $('iframe[src*="' + data.widgetId + '"]');
                if (iframe.length) {
                  iframe.height(data.height);
                }
              }
              break;
          }
        }
      });
    }
  };

  /**
   * Auto-close sidebar after successful donation (optional enhancement).
   */
  Drupal.behaviors.passItOnAutoClose = {
    attach: function (context, settings) {
      // Listen for donation completion messages
      $(window).on('message', function(e) {
        var data = e.originalEvent.data;
        if (data && data.type === 'passiton-donation-complete') {
          // Auto-close after 3 seconds
          setTimeout(function() {
            $('.passiton-modal').hide().removeClass('open');
            $('.passiton-sidebar-widget').removeClass('open');
            $('body').css('overflow', 'auto');
          }, 3000);
        }
      });
    }
  };

})(jQuery, Drupal);