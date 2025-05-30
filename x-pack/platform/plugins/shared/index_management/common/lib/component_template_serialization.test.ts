/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  deserializeComponentTemplate,
  serializeComponentTemplate,
} from './component_template_serialization';

describe('Component template serialization', () => {
  describe('deserializeComponentTemplate()', () => {
    test('deserializes a component template', () => {
      expect(
        deserializeComponentTemplate(
          {
            name: 'my_component_template',
            component_template: {
              version: 1,
              _meta: {
                serialization: {
                  id: 10,
                  class: 'MyComponentTemplate',
                },
                description: 'set number of shards to one',
              },
              template: {
                settings: {
                  number_of_shards: 1,
                },
                mappings: {
                  _source: {
                    enabled: false,
                  },
                  properties: {
                    host_name: {
                      type: 'keyword',
                    },
                    created_at: {
                      type: 'date',
                      format: 'EEE MMM dd HH:mm:ss Z yyyy',
                    },
                  },
                },
              },
            },
          },
          [
            {
              name: 'my_index_template',
              index_template: {
                index_patterns: ['foo'],
                template: {
                  settings: {
                    number_of_replicas: 2,
                  },
                },
                composed_of: ['my_component_template'],
              },
            },
          ]
        )
      ).toEqual({
        deprecated: undefined,
        name: 'my_component_template',
        version: 1,
        _meta: {
          serialization: {
            id: 10,
            class: 'MyComponentTemplate',
          },
          description: 'set number of shards to one',
        },
        template: {
          settings: {
            number_of_shards: 1,
          },
          mappings: {
            _source: {
              enabled: false,
            },
            properties: {
              host_name: {
                type: 'keyword',
              },
              created_at: {
                type: 'date',
                format: 'EEE MMM dd HH:mm:ss Z yyyy',
              },
            },
          },
        },
        _kbnMeta: {
          usedBy: ['my_index_template'],
          isManaged: false,
        },
      });
    });
  });

  describe('serializeComponentTemplate()', () => {
    const deserializedComponentTemplate = {
      name: 'my_component_template',
      version: 1,
      _kbnMeta: {
        usedBy: [],
        isManaged: false,
      },
      _meta: {
        serialization: {
          id: 10,
          class: 'MyComponentTemplate',
        },
        description: 'set number of shards to one',
      },
      template: {
        settings: {
          number_of_shards: 1,
        },
        mappings: {
          _source: {
            enabled: false,
          },
          properties: {
            host_name: {
              type: 'keyword',
            },
            created_at: {
              type: 'date',
              format: 'EEE MMM dd HH:mm:ss Z yyyy',
            },
          },
        },
      },
    };
    test('serialize a component template', () => {
      expect(serializeComponentTemplate(deserializedComponentTemplate)).toEqual({
        version: 1,
        _meta: {
          serialization: {
            id: 10,
            class: 'MyComponentTemplate',
          },
          description: 'set number of shards to one',
        },
        template: {
          settings: {
            number_of_shards: 1,
          },
          mappings: {
            _source: {
              enabled: false,
            },
            properties: {
              host_name: {
                type: 'keyword',
              },
              created_at: {
                type: 'date',
                format: 'EEE MMM dd HH:mm:ss Z yyyy',
              },
            },
          },
        },
      });
    });
    test('serialize a component template with data stream options', () => {
      expect(
        serializeComponentTemplate(deserializedComponentTemplate, {
          failure_store: { enabled: true },
        })
      ).toEqual({
        version: 1,
        _meta: {
          serialization: {
            id: 10,
            class: 'MyComponentTemplate',
          },
          description: 'set number of shards to one',
        },
        template: {
          settings: {
            number_of_shards: 1,
          },
          mappings: {
            _source: {
              enabled: false,
            },
            properties: {
              host_name: {
                type: 'keyword',
              },
              created_at: {
                type: 'date',
                format: 'EEE MMM dd HH:mm:ss Z yyyy',
              },
            },
          },
          data_stream_options: {
            failure_store: { enabled: true },
          },
        },
      });
    });
  });
});
