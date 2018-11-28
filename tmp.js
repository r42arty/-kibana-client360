{
  "$schema": "https://vega.github.io/schema/vega/v3.0.json",
  "title": "Дефекты ПРОМ",

  "data": [
    {
      "name": "jira_source",
      "url": {
        "index": "metrics-jira-changelog-*",
        "body": {
          "size": 0,
          "query": {
            "bool": {
              "must": [
                  {
                  "query_string": {
                    "query": "project.key:(mpepk) AND issuetype.name:(incident)"
                  }
                },
                {"range" : {"@timestamp" : { "gte" : "2018-11-27", "lte" : "now" }}},
                {"exists": {"field": "status.name.keyword"}}
              ],
              "must_not": [
              {"query_string": {"query": "webhookEvent:(jira:issue_deleted)"
              }}
              ]
            }
          },
          "aggs": {
            "issue": {
              "terms": {"field": "issue_key.keyword",
                        "size": 10000000},
              "aggs": {
                "system_data": {
                  "top_hits": {
                    "size": 1,
                    "sort": [{"@timestamp": "desc"}],
                    "_source": {"includes": ["status.name", "priority"]}
                  }
                }
              }
            }
          }
        }
      },
      "format": {"type": "json", "property": "aggregations.issue.buckets"},
      "transform": [
        {
          "type": "formula",
          "expr": "datum.system_data.hits.hits[0]._source.status.name",
          "as": "status"
        },
        {
          "type": "formula",
          "expr": "(datum.system_data.hits.hits[0]._source.priority == 'Blocker' || datum.system_data.hits.hits[0]._source.priority == 'Critical' || datum.system_data.hits.hits[0]._source.priority == 'Major' || datum.system_data.hits.hits[0]._source.priority == 'Minor' || datum.system_data.hits.hits[0]._source.priority == 'Trivial') ? datum.system_data.hits.hits[0]._source.priority : 'Other type'",
          "as": "priority"
        },
        {"type": "aggregate", "as": ["count"], "groupby": ["status", "priority"]},
        {
          "type": "stack",
          "groupby": ["status"],
          "sort": {"field": "priority", "order": "descending"},
          "field": "count"
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "x_scale",
      "domain": {"data": "jira_source", "field": "status", "sort": true,
          "sort": {
          "op": "median",
          "field": "y1",
          "order": "upscending"
          }
      },
      "type": "band",
      "range": "width",
      "padding": 0.1,
      "round": true
    },

    {
      "name": "y_scale",
      "domain": {"data": "jira_source", "field": "y1"},
      "type": "linear",
      "range": "height",
      "nice": true,
      "zero": true
    },

    {
      "name": "color_scale",
      "type": "ordinal",
      "domain": ["Blocker", "Critical", "Major", "Minor", "Trivial"],
      "range": ["#f8173e", "#ffa500", "#ffd700", "#50c878", "#120a8f"]
    }
  ],

  "axes": [
    {
      "orient": "bottom",
      "scale": "x_scale",
      "encode": {
        "labels": {
          "update": {
            "align": {"value": "center"},
            "baseline": {"value": "top"},
            "fontSize": {"value": 12},
            "font": {"value": "Segoe UI, Helvetica, Open Sans, Arial"},
            "fill": {"value": "#666"}
          }
        }
      }
    },
    {
      "scale": "y_scale",
      "orient": "left",
      "encode": {
        "labels": {
          "update": {
            "fontSize": {"value": 12},
            "font": {"value": "Segoe UI, Helvetica, Open Sans, Arial"},
            "fill": {"value": "#666"}
          }
        }
      }
    }
  ],

  "marks": [
    {
      "type": "rect",
      "from": {"data": "jira_source"},
      "encode": {
        "enter": {
          "x": {"scale": "x_scale", "field": "status"},
          "width": {"scale": "x_scale", "band": 1},
          "y": {"scale": "y_scale", "field": "y0"},
          "y2": {"scale": "y_scale", "field": "y1"},
          "fill": {"scale": "color_scale", "field": "priority"}
        },
        "update": {"fillOpacity": {"value": 1}},
        "hover": {"fillOpacity": {"value": 0.5}}
      }
    },
    {
      "type": "text",
      "from": {"data": "jira_source"},
      "encode": {
        "enter": {
          // "x": {"scale": "x_scale", "signal": "datum.y0+(datum.y1-datum.y0)/2"},
          // "y": {"scale": "y_scale", "field": "status", "band": 0.5 },
          "x": {"scale": "x_scale", "field": "status", "band": 0.5 },
          "y": {"scale": "y_scale", "signal": "datum.y0+(datum.y1-datum.y0)/2"},
          "fill": {"signal": "(datum.priority=='Blocker') ? 'white' : 'black'"},
          "baseline": {"value": "middle"},
          "align": {"value": "center"},
          "font": {"value": "Segoe UI, Helvetica, Open Sans, Arial"},
          "text": {"signal": "(datum.y1-datum.y0)>0 ? datum.y1-datum.y0 : ' '"}
          
        }
      }
    }
  ],

  "legends": [
    {
      "fill": "color_scale",
      "orient": "top-left",
      "encode": {
        "labels": {
          "update": {
            "fontSize": {"value": 12},
            "fill": {"value": "#666"},
            "font": {"value": "Segoe UI, Helvetica, Open Sans, Arial"}
          },
          "hover": {"fill": {"value": "firebrick"}}
        },
        "symbols": {"update": {"stroke": {"value": "transparent"}}},
        "legend": {"update": {"stroke": {"value": "#ccc"}, "strokeWidth": {"value": 0}}}
      }
    }
  ],
  
  "config": {
    "style": {"cell": {"stroke": "transparent"}},
    "title": {
      "fontSize": 20,
      "offset": "15",
      "fontWeight": "normal",
      "font": {"value": "Segoe UI Light, Helvetica, Open Sans, Arial"},
//      "color": {"value": "#eee"}
    },

    "axis": {
      "titleColor": "#ddd",
      "titleFontWeight": "normal",
      "domainColor": "#444",
      "tickColor": "#444",
      "titleLimit": "300",
      "titleFont": {"value": "Segoe UI Light, Helvetica, Open Sans, Arial"}
    }
  }
}
