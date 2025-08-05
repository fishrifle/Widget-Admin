<?php
/**
 * Plugin Name: PassItOn Donation Widget
 * Plugin URI: https://your-domain.com
 * Description: Embed PassItOn donation widgets anywhere on your WordPress site
 * Version: 1.0.0
 * Author: PassItOn
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class PassItOnWidget {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_shortcode('passiton_widget', array($this, 'render_widget_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'add_widget_script'));
    }
    
    public function init() {
        // Initialize plugin
    }
    
    public function enqueue_scripts() {
        // Only load if shortcode is present
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'passiton_widget')) {
            wp_enqueue_script('jquery');
        }
    }
    
    public function render_widget_shortcode($atts) {
        $atts = shortcode_atts(array(
            'slug' => '',
            'width' => '100%',
            'height' => '600px',
            'domain' => 'your-domain.com', // Replace with your actual domain
            'style' => 'modal' // modal, inline, or sidebar
        ), $atts);
        
        if (empty($atts['slug'])) {
            return '<p style="color: red;">Error: Widget slug is required. Usage: [passiton_widget slug="your-widget-slug"]</p>';
        }
        
        $widget_id = 'passiton-widget-' . uniqid();
        $widget_url = 'https://' . $atts['domain'] . '/widget/' . $atts['slug'];
        
        if ($atts['style'] === 'modal') {
            return $this->render_modal_widget($widget_id, $widget_url, $atts);
        } elseif ($atts['style'] === 'sidebar') {
            return $this->render_sidebar_widget($widget_id, $widget_url, $atts);
        } else {
            return $this->render_inline_widget($widget_id, $widget_url, $atts);
        }
    }
    
    private function render_inline_widget($widget_id, $widget_url, $atts) {
        return sprintf(
            '<div id="%s" class="passiton-widget-container" style="width: %s; height: %s;">
                <iframe src="%s" width="100%%" height="100%%" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>
            </div>',
            esc_attr($widget_id),
            esc_attr($atts['width']),
            esc_attr($atts['height']),
            esc_url($widget_url)
        );
    }
    
    private function render_modal_widget($widget_id, $widget_url, $atts) {
        return sprintf(
            '<div class="passiton-modal-trigger">
                <button id="%s-trigger" class="passiton-donate-btn" style="
                    background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 6px 20px rgba(102, 126, 234, 0.6)\';" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 4px 15px rgba(102, 126, 234, 0.4)\';">
                    💝 Donate Now
                </button>
                <div id="%s-modal" class="passiton-modal" style="display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%%; height: 100%%; background-color: rgba(0,0,0,0.5);">
                    <div class="passiton-modal-content" style="position: relative; margin: 2%% auto; width: 90%%; max-width: 500px; height: 90%%; background: white; border-radius: 12px; overflow: hidden;">
                        <span class="passiton-close" style="position: absolute; top: 15px; right: 20px; font-size: 28px; font-weight: bold; cursor: pointer; z-index: 10001; color: #999; background: white; border-radius: 50%%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">&times;</span>
                        <iframe src="%s" width="100%%" height="100%%" frameborder="0" style="border: none;"></iframe>
                    </div>
                </div>
            </div>',
            esc_attr($widget_id),
            esc_attr($widget_id),
            esc_url($widget_url)
        );
    }
    
    private function render_sidebar_widget($widget_id, $widget_url, $atts) {
        return sprintf(
            '<div id="%s-sidebar" class="passiton-sidebar-widget" style="
                position: fixed;
                right: -320px;
                top: 50%%;
                transform: translateY(-50%%);
                width: 300px;
                height: 500px;
                background: white;
                border-radius: 12px 0 0 12px;
                box-shadow: -4px 0 20px rgba(0,0,0,0.15);
                z-index: 9999;
                transition: right 0.3s ease;
                overflow: hidden;
            ">
                <div class="passiton-sidebar-tab" style="
                    position: absolute;
                    left: -50px;
                    top: 50%%;
                    transform: translateY(-50%%) rotate(-90deg);
                    background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px 8px 0 0;
                    cursor: pointer;
                    font-weight: 600;
                    white-space: nowrap;
                    user-select: none;
                ">💝 Donate</div>
                <iframe src="%s" width="100%%" height="100%%" frameborder="0" style="border: none;"></iframe>
            </div>',
            esc_attr($widget_id),
            esc_url($widget_url)
        );
    }
    
    public function add_widget_script() {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'passiton_widget')) {
            ?>
            <script>
            jQuery(document).ready(function($) {
                // Modal functionality
                $('.passiton-modal-trigger button').on('click', function() {
                    var modalId = $(this).attr('id').replace('-trigger', '-modal');
                    $('#' + modalId).show();
                });
                
                $('.passiton-close').on('click', function() {
                    $(this).closest('.passiton-modal').hide();
                });
                
                $(window).on('click', function(e) {
                    if ($(e.target).hasClass('passiton-modal')) {
                        $(e.target).hide();
                    }
                });
                
                // Sidebar functionality
                $('.passiton-sidebar-tab').on('click', function() {
                    var sidebar = $(this).parent();
                    var isOpen = sidebar.css('right') === '0px';
                    sidebar.css('right', isOpen ? '-320px' : '0px');
                });
                
                // Close sidebar when clicking outside
                $(document).on('click', function(e) {
                    if (!$(e.target).closest('.passiton-sidebar-widget').length) {
                        $('.passiton-sidebar-widget').css('right', '-320px');
                    }
                });
            });
            </script>
            <?php
        }
    }
}

// Initialize the plugin
new PassItOnWidget();

// Add admin menu for settings
add_action('admin_menu', 'passiton_admin_menu');

function passiton_admin_menu() {
    add_options_page(
        'PassItOn Widget Settings',
        'PassItOn Widget',
        'manage_options',
        'passiton-widget',
        'passiton_admin_page'
    );
}

function passiton_admin_page() {
    if (isset($_POST['submit'])) {
        update_option('passiton_domain', sanitize_text_field($_POST['passiton_domain']));
        echo '<div class="notice notice-success"><p>Settings saved!</p></div>';
    }
    
    $domain = get_option('passiton_domain', 'your-domain.com');
    ?>
    <div class="wrap">
        <h1>PassItOn Widget Settings</h1>
        <form method="post" action="">
            <table class="form-table">
                <tr>
                    <th scope="row">Widget Domain</th>
                    <td>
                        <input type="text" name="passiton_domain" value="<?php echo esc_attr($domain); ?>" class="regular-text" />
                        <p class="description">Enter your PassItOn domain (e.g., your-domain.com)</p>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        
        <h2>Usage Examples</h2>
        <h3>Inline Widget</h3>
        <code>[passiton_widget slug="your-widget-slug" style="inline"]</code>
        
        <h3>Modal Widget</h3>
        <code>[passiton_widget slug="your-widget-slug" style="modal"]</code>
        
        <h3>Sidebar Widget</h3>
        <code>[passiton_widget slug="your-widget-slug" style="sidebar"]</code>
        
        <h3>Custom Size</h3>
        <code>[passiton_widget slug="your-widget-slug" width="400px" height="500px"]</code>
    </div>
    <?php
}
?>