const TDA_FLOW = {
  "last_node_id": 7,
  "last_link_id": 8,
  "nodes": [
    {
      "id": 1,
      "type": "util/python",
      "pos": [
        50,
        150
      ],
      "size": {
        "0": 210,
        "1": 58
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [
        {
          "name": "data",
          "type": "array",
          "link": null
        }
      ],
      "outputs": [
        {
          "name": "result",
          "type": "*",
          "links": [
            1,
            2,
            3
          ]
        }
      ],
      "properties": {
        "code": "import numpy as np\nresult = np.random.rand(30,2).tolist()"
      },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 2,
      "type": "viz/vietoris_rips",
      "pos": [
        250,
        150
      ],
      "size": {
        "0": 200,
        "1": 150
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        {
          "name": "points",
          "type": "array",
          "link": 1
        }
      ],
      "outputs": [
        {
          "name": "image",
          "type": "string",
          "links": [
            4
          ]
        },
        {
          "name": "eps",
          "type": "number",
          "links": [
            5,
            6
          ]
        }
      ],
      "properties": {
        "epsilon": 1
      },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 3,
      "type": "viz/persistence",
      "pos": [
        450,
        50
      ],
      "size": {
        "0": 200,
        "1": 150
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        {
          "name": "points",
          "type": "array",
          "link": 2
        },
        {
          "name": "eps",
          "type": "number",
          "link": 5
        }
      ],
      "outputs": [
        {
          "name": "image",
          "type": "string",
          "links": [
            7
          ]
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 4,
      "type": "viz/barcode",
      "pos": [
        450,
        250
      ],
      "size": {
        "0": 200,
        "1": 150
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "points",
          "type": "array",
          "link": 3
        },
        {
          "name": "eps",
          "type": "number",
          "link": 6
        }
      ],
      "outputs": [
        {
          "name": "image",
          "type": "string",
          "links": [
            8
          ]
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 5,
      "type": "viz/view",
      "pos": [
        650,
        150
      ],
      "size": [
        200,
        150
      ],
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "image",
          "type": "string",
          "link": 4
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 6,
      "type": "viz/view",
      "pos": [
        850,
        50
      ],
      "size": [
        200,
        150
      ],
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "image",
          "type": "string",
          "link": 7
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 7,
      "type": "viz/view",
      "pos": [
        850,
        250
      ],
      "size": [
        200,
        150
      ],
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "image",
          "type": "string",
          "link": 8
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    }
  ],
  "links": [
    [
      1,
      1,
      0,
      2,
      0,
      "array"
    ],
    [
      2,
      1,
      0,
      3,
      0,
      "array"
    ],
    [
      3,
      1,
      0,
      4,
      0,
      "array"
    ],
    [
      4,
      2,
      0,
      5,
      0,
      "string"
    ],
    [
      5,
      2,
      1,
      3,
      1,
      "number"
    ],
    [
      6,
      2,
      1,
      4,
      1,
      "number"
    ],
    [
      7,
      3,
      0,
      6,
      0,
      "string"
    ],
    [
      8,
      4,
      0,
      7,
      0,
      "string"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
}
;

const BIAS_REPORT_FLOW = {
  "last_node_id": 3,
  "last_link_id": 2,
  "nodes": [
    {
      "id": 1,
      "type": "data/titanic",
      "pos": [50, 50],
      "size": { "0": 210, "1": 84 },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        { "name": "data", "type": "array", "links": [1] }
      ],
      "properties": { "limit": 100 },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 2,
      "type": "transform/select",
      "pos": [260, 50],
      "size": { "0": 210, "1": 120 },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        { "name": "data", "type": "array", "link": 1 }
      ],
      "outputs": [
        { "name": "values", "type": "array", "links": [2] },
        { "name": "columns", "type": "array", "links": [] }
      ],
      "properties": { "field": "Age", "fields": [] },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 3,
      "type": "analysis/bias_report",
      "pos": [480, 50],
      "size": { "0": 220, "1": 150 },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        { "name": "data", "type": "array", "link": 2 }
      ],
      "outputs": [
        { "name": "report", "type": "object", "links": [] }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    }
  ],
  "links": [
    [1, 1, 0, 2, 0, "array"],
    [2, 2, 0, 3, 0, "array"]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const RANDOM_FOREST_FLOW = {
  "last_node_id": 6,
  "last_link_id": 7,
  "nodes": [
    {
      "id": 1,
      "type": "data/random",
      "pos": [
        50,
        150
      ],
      "size": {
        "0": 210,
        "1": 58
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "data",
          "type": "array",
          "links": [
            1,
            3,
            5
          ]
        }
      ],
      "properties": {
        "count": 20,
        "columns": 3,
        "min": 0,
        "max": 1,
        "integer": false
      },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 2,
      "type": "data/random_labels",
      "pos": [
        50,
        240
      ],
      "size": {
        "0": 210,
        "1": 58
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [
        {
          "name": "data",
          "type": "array",
          "link": 1
        }
      ],
      "outputs": [
        {
          "name": "labels",
          "type": "array",
          "links": [
            2
          ]
        }
      ],
      "properties": {
        "count": 20,
        "classes": 2
      },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 3,
      "type": "ml/random_forest",
      "pos": [
        280,
        190
      ],
      "size": [
        240,
        160
      ],
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        {
          "name": "data",
          "type": "array",
          "link": 3
        },
        {
          "name": "target",
          "type": "array",
          "link": 2
        }
      ],
      "outputs": [
        {
          "name": "prediction",
          "type": "array",
          "links": []
        },
        {
          "name": "model",
          "type": "string",
          "links": [
            4
          ]
        },
        {
          "name": "importance",
          "type": "array",
          "links": []
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 4,
      "type": "ml/explain_model",
      "pos": [
        520,
        190
      ],
      "size": {
        "0": 200,
        "1": 100
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "model",
          "type": "string",
          "link": 4
        },
        {
          "name": "data",
          "type": "array",
          "link": 5
        }
      ],
      "outputs": [
        {
          "name": "contrib",
          "type": "array",
          "links": [
            6
          ]
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 5,
      "type": "viz/bar_chart",
      "pos": [
        740,
        190
      ],
      "size": {
        "0": 200,
        "1": 150
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "data",
          "type": "array",
          "link": 6
        }
      ],
      "outputs": [
        {
          "name": "image",
          "type": "string",
          "links": [
            7
          ]
        }
      ],
      "properties": {
        "field": "contribution"
      },
      "color": "#222",
      "bgcolor": "#444"
    },
    {
      "id": 6,
      "type": "viz/view",
      "pos": [
        960,
        190
      ],
      "size": [
        200,
        150
      ],
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "image",
          "type": "string",
          "link": 7
        }
      ],
      "properties": {},
      "color": "#222",
      "bgcolor": "#444"
    }
  ],
  "links": [
    [
      1,
      1,
      0,
      2,
      0,
      "array"
    ],
    [
      2,
      2,
      0,
      3,
      1,
      "array"
    ],
    [
      3,
      1,
      0,
      3,
      0,
      "array"
    ],
    [
      4,
      3,
      1,
      4,
      0,
      "string"
    ],
    [
      5,
      1,
      0,
      4,
      1,
      "array"
    ],
    [
      6,
      4,
      0,
      5,
      0,
      "array"
    ],
    [
      7,
      5,
      0,
      6,
      0,
      "string"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};
