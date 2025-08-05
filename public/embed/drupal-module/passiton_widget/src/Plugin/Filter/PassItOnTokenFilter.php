<?php

namespace Drupal\passiton_widget\Plugin\Filter;

use Drupal\filter\FilterProcessResult;
use Drupal\filter\Plugin\FilterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

/**
 * Provides a filter to process PassItOn widget tokens.
 *
 * @Filter(
 *   id = "passiton_token_filter",
 *   title = @Translation("PassItOn Widget Token Filter"),
 *   description = @Translation("Converts [passiton-widget:slug] tokens into embedded widgets."),
 *   type = Drupal\filter\Plugin\FilterInterface::TYPE_MARKUP_LANGUAGE,
 *   weight = 0,
 * )
 */
class PassItOnTokenFilter extends FilterBase implements ContainerFactoryPluginInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a PassItOnTokenFilter object.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Config\ConfigFactoryInterface $config_factory
   *   The config factory.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, ConfigFactoryInterface $config_factory) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->configFactory = $config_factory;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('config.factory')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function process($text, $langcode) {
    $config = $this->configFactory->get('passiton_widget.settings');
    $domain = $config->get('domain') ?: 'your-domain.com';

    // Pattern: [passiton-widget:slug] or [passiton-widget:slug:style:width:height]
    $pattern = '/\[passiton-widget:([^:\]]+)(?::([^:\]]+))?(?::([^:\]]+))?(?::([^:\]]+))?\]/';
    
    $text = preg_replace_callback($pattern, function($matches) use ($domain) {
      $slug = $matches[1];
      $style = isset($matches[2]) ? $matches[2] : 'inline';
      $width = isset($matches[3]) ? $matches[3] : '100%';
      $height = isset($matches[4]) ? $matches[4] : '600px';
      
      $widget_id = 'passiton-widget-' . uniqid();
      $widget_url = 'https://' . $domain . '/widget/' . $slug;
      
      switch ($style) {
        case 'modal':
          return $this->renderModalWidget($widget_id, $widget_url);
        case 'sidebar':
          return $this->renderSidebarWidget($widget_id, $widget_url);
        default:
          return $this->renderInlineWidget($widget_id, $widget_url, $width, $height);
      }
    }, $text);

    return new FilterProcessResult($text);
  }

  /**
   * Renders an inline widget.
   */
  private function renderInlineWidget($widget_id, $widget_url, $width, $height) {
    return sprintf(
      '<div id="%s" class="passiton-widget-container" style="width: %s; height: %s;">
        <iframe src="%s" width="100%%" height="100%%" frameborder="0" style="border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"></iframe>
      </div>',
      htmlspecialchars($widget_id),
      htmlspecialchars($width),
      htmlspecialchars($height),
      htmlspecialchars($widget_url)
    );
  }

  /**
   * Renders a modal widget.
   */
  private function renderModalWidget($widget_id, $widget_url) {
    return sprintf(
      '<div class="passiton-modal-trigger">
        <button id="%s-trigger" class="passiton-donate-btn">💝 Donate Now</button>
        <div id="%s-modal" class="passiton-modal" style="display: none;">
          <div class="passiton-modal-content">
            <span class="passiton-close">&times;</span>
            <iframe src="%s" width="100%%" height="100%%" frameborder="0"></iframe>
          </div>
        </div>
      </div>',
      htmlspecialchars($widget_id),
      htmlspecialchars($widget_id),
      htmlspecialchars($widget_url)
    );
  }

  /**
   * Renders a sidebar widget.
   */
  private function renderSidebarWidget($widget_id, $widget_url) {
    return sprintf(
      '<div id="%s-sidebar" class="passiton-sidebar-widget">
        <div class="passiton-sidebar-tab">💝 Donate</div>
        <iframe src="%s" width="100%%" height="100%%" frameborder="0"></iframe>
      </div>',
      htmlspecialchars($widget_id),
      htmlspecialchars($widget_url)
    );
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $config = $this->configFactory->get('passiton_widget.settings');
    
    $form['domain'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Widget Domain'),
      '#default_value' => $config->get('domain') ?: 'your-domain.com',
      '#description' => $this->t('Enter your PassItOn domain (e.g., your-domain.com)'),
    ];
    
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function tips($long = FALSE) {
    return $this->t('
      <p><strong>PassItOn Widget Tokens:</strong></p>
      <ul>
        <li><code>[passiton-widget:your-slug]</code> - Inline widget</li>
        <li><code>[passiton-widget:your-slug:modal]</code> - Modal popup</li>
        <li><code>[passiton-widget:your-slug:sidebar]</code> - Sidebar widget</li>
        <li><code>[passiton-widget:your-slug:inline:400px:500px]</code> - Custom size</li>
      </ul>
    ');
  }
}