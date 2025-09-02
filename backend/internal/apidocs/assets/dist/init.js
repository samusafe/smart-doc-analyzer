window.addEventListener('load', function(){
  window.ui = SwaggerUIBundle({
    url: '/spec/openapi.yaml',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout'
  });
});
