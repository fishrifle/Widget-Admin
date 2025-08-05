<?php

namespace Drupal\passiton_widget\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Drupal\Core\Config\ConfigFactoryInterface;

/**
 * Provides a PassItOn Widget block.
 *
 * @Block(
 *  id = "passiton_widget_block",
 *  admin_label = @Translation("PassItOn Widget"),
 *  category = @Translation("PassItOn")
 * )
 */
class PassItOnWidgetBlock extends BlockBase implements ContainerFactoryPluginInterface {

  /**
   * The config factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $configFactory;

  /**
   * Constructs a PassItOnWidgetBlock object.
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
  public function build() {
    $config = $this->getConfiguration();
    $global_config = $this->configFactory->get('passiton_widget.settings');
    
    $slug = $config['widget_slug'] ?? '';
    $style = $config['widget_style'] ?? 'inline';
    $width = $config['widget_width'] ?? '100%';
    $height = $config['widget_height'] ?? '600px';
    $domain = $global_config->get('domain') ?: 'your-domain.com';
    
    if (empty($slug)) {
      return [
        '#markup' => '<p style="color: red;">Error: Widget slug is required in block configuration.</p>',
      ];
    }
    
    $widget_id = 'passiton-widget-' . uniqid();
    $widget_url = 'https://' . $domain . '/widget/' . $slug;
    
    $build = [
      '#attached' => [
        'library' => ['passiton_widget/widget_scripts'],
      ],
    ];
    
    switch ($style) {
      case 'modal':
        $build['#theme'] = 'passiton_widget_modal';
        $build['#widget_url'] = $widget_url;
        $build['#widget_id'] = $widget_id;
        $build['#button_text'] = $config['button_text'] ?? 'Donate Now';
        break;
        
      case 'sidebar':
        $build['#theme'] = 'passiton_widget_sidebar';
        $build['#widget_url'] = $widget_url;
        $build['#widget_id'] = $widget_id;
        break;
        
      default:
        $build['#theme'] = 'passiton_widget_inline';
        $build['#widget_url'] = $widget_url;
        $build['#width'] = $width;
        $build['#height'] = $height;
        $build['#widget_id'] = $widget_id;
        break;
    }
    
    return $build;
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $config = $this->getConfiguration();
    
    $form['widget_slug'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Widget Slug'),
      '#description' => $this->t('Enter the slug of your PassItOn widget.'),
      '#default_value' => $config['widget_slug'] ?? '',
      '#required' => TRUE,
    ];
    
    $form['widget_style'] = [
      '#type' => 'select',
      '#title' => $this->t('Widget Style'),
      '#options' => [
        'inline' => $this->t('Inline'),
        'modal' => $this->t('Modal Popup'),
        'sidebar' => $this->t('Sidebar'),
      ],
      '#default_value' => $config['widget_style'] ?? 'inline',
    ];
    
    $form['widget_width'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Width'),
      '#description' => $this->t('Widget width (e.g., 100%, 400px)'),
      '#default_value' => $config['widget_width'] ?? '100%',
      '#states' => [
        'visible' => [
          ':input[name="settings[widget_style]"]' => ['value' => 'inline'],
        ],
      ],
    ];
    
    $form['widget_height'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Height'),
      '#description' => $this->t('Widget height (e.g., 600px, 500px)'),
      '#default_value' => $config['widget_height'] ?? '600px',
      '#states' => [
        'visible' => [
          ':input[name="settings[widget_style]"]' => ['value' => 'inline'],
        ],
      ],
    ];
    
    $form['button_text'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Button Text'),
      '#description' => $this->t('Text for the donate button'),
      '#default_value' => $config['button_text'] ?? 'Donate Now',
      '#states' => [
        'visible' => [
          ':input[name="settings[widget_style]"]' => ['value' => 'modal'],
        ],
      ],
    ];
    
    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $this->configuration['widget_slug'] = $form_state->getValue('widget_slug');
    $this->configuration['widget_style'] = $form_state->getValue('widget_style');
    $this->configuration['widget_width'] = $form_state->getValue('widget_width');
    $this->configuration['widget_height'] = $form_state->getValue('widget_height');
    $this->configuration['button_text'] = $form_state->getValue('button_text');
  }
}