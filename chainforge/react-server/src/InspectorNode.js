import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Handle } from 'react-flow-renderer';
import useStore from './store';
import NodeLabel from './NodeLabelComponent'
import LLMResponseInspector, { exportToExcel } from './LLMResponseInspector';
import {BASE_URL} from './store';

const InspectorNode = ({ data, id }) => {

  let is_fetching = false;

  const [jsonResponses, setJSONResponses] = useState(null);

  const [pastInputs, setPastInputs] = useState([]);
  const inputEdgesForNode = useStore((state) => state.inputEdgesForNode);
  const setDataPropsForNode = useStore((state) => state.setDataPropsForNode);

<<<<<<< HEAD
=======
  // The MultiSelect so people can dynamically set what vars they care about
  const [multiSelectVars, setMultiSelectVars] = useState(data.vars || []);
  const [multiSelectValue, setMultiSelectValue] = useState(data.selected_vars || []);

  // Global lookup for what color to use per LLM
  const getColorForLLMAndSetIfNotFound = useStore((state) => state.getColorForLLMAndSetIfNotFound);

  // Update the visualization when the MultiSelect values change:
  useEffect(() => {
    if (!jsonResponses || (Array.isArray(jsonResponses) && jsonResponses.length === 0))
        return;

    const responses = jsonResponses;
    const selected_vars = multiSelectValue;

    // Functions to associate a color to each LLM in responses
    // const llm_colors = ['#ace1aeb1', '#f1b963b1', '#e46161b1', '#f8f398b1', '#defcf9b1', '#cadefcb1', '#c3bef0b1', '#cca8e9b1'];
    const color_for_llm = (llm) => (getColorForLLMAndSetIfNotFound(llm) + '99');
    // const llm_badge_colors = ['green', 'orange', 'red', 'yellow', 'cyan', 'indigo', 'grape'];
    const badge_color_for_llm = (llm) => 'blue';
    const response_box_colors = ['#eee', '#fff', '#eee', '#ddd', '#eee', '#ddd', '#eee'];
    const rgroup_color = (depth) => response_box_colors[depth % response_box_colors.length];

    const getHeaderBadge = (key, val) => {
        if (val) {
            const s = truncStr(val.trim(), 144);
            return (<div className="response-var-header">
                <span className="response-var-name">{key}&nbsp;=&nbsp;</span><span className="response-var-value">"{s}"</span>
            </div>);
        } else {
            return (<div className="response-var-header">{`unspecified ${key}`}</div>);
        }
    };

    // Now we need to perform groupings by each var in the selected vars list,
    // nesting the groupings (preferrably with custom divs) and sorting within 
    // each group by value of that group's var (so all same values are clumped together).
    // :: For instance, for varnames = ['LLM', '$var1', '$var2'] we should get back 
    // :: nested divs first grouped by LLM (first level), then by var1, then var2 (deepest level).
    let leaf_id = 0;
    const groupByVars = (resps, varnames, eatenvars, header) => {
        if (resps.length === 0) return [];
        if (varnames.length === 0) {
            // Base case. Display n response(s) to each single prompt, back-to-back:
            const resp_boxes = resps.map((res_obj, res_idx) => {

                const eval_res_items = res_obj.eval_res ? res_obj.eval_res.items : null;

                // Spans for actual individual response texts
                const ps = eval_res_items ? (
                    res_obj.responses.map((r, idx) => (
                        <div key={idx}>
                            <pre className="small-response">{r}</pre>
                            <p className="small-response-metrics">{getEvalResultStr(eval_res_items[idx])}</p>
                        </div>
                    ))) : (
                    res_obj.responses.map((r, idx) => (
                        <pre key={idx} className="small-response">{r}</pre>
                    )));

                // At the deepest level, there may still be some vars left over. We want to display these
                // as tags, too, so we need to display only the ones that weren't 'eaten' during the recursive call:
                // (e.g., the vars that weren't part of the initial 'varnames' list that form the groupings)
                const unused_vars = filterDict(res_obj.vars, v => !eatenvars.includes(v));
                const vars = vars_to_str(unused_vars);
                const var_tags = vars.map((v) => 
                    (<Badge key={v} color="blue" size="xs">{v}</Badge>)
                );
                return (
                    <div key={"r"+res_idx} className="response-box" style={{ backgroundColor: color_for_llm(res_obj.llm) }}>
                        {var_tags}
                        {eatenvars.includes('LLM') ?
                              ps
                            : (<div className="response-item-llm-name-wrapper">
                                    {ps}
                                    <h1>{res_obj.llm}</h1>
                              </div>)
                        }
                    </div>
                );
            });
            const className = eatenvars.length > 0 ? "response-group" : "";
            const boxesClassName = eatenvars.length > 0 ? "response-boxes-wrapper" : "";
            leaf_id += 1;
            return (
                <div key={'l'+leaf_id} className={className} style={{ backgroundColor: rgroup_color(eatenvars.length) }}>
                    {header}
                    <div className={boxesClassName}>
                        {resp_boxes}
                    </div>
                </div>
            );
        }

        // Bucket responses by the first var in the list, where
        // we also bucket any 'leftover' responses that didn't have the requested variable (a kind of 'soft fail')
        const group_name = varnames[0];
        const [grouped_resps, leftover_resps] = (group_name === 'LLM') 
                                                ? groupResponsesBy(resps, (r => r.llm)) 
                                                : groupResponsesBy(resps, (r => ((group_name in r.vars) ? r.vars[group_name] : null)));
        const get_header = (group_name === 'LLM') 
                            ? ((key, val) => (<Badge key={val} color={badge_color_for_llm(val)} size="sm">{val}</Badge>))
                            : ((key, val) => getHeaderBadge(key, val));
        
        // Now produce nested divs corresponding to the groups
        const remaining_vars = varnames.slice(1);
        const updated_eatenvars = eatenvars.concat([group_name]);
        const grouped_resps_divs = Object.keys(grouped_resps).map(g => groupByVars(grouped_resps[g], remaining_vars, updated_eatenvars, get_header(group_name, g)));
        const leftover_resps_divs = leftover_resps.length > 0 ? groupByVars(leftover_resps, remaining_vars, updated_eatenvars, get_header(group_name, undefined)) : [];

        return (<>
            {header ? 
                (<div key={group_name} className="response-group" style={{ backgroundColor: rgroup_color(eatenvars.length) }}>
                    {header}
                    <div className="response-boxes-wrapper">
                        {grouped_resps_divs}
                    </div>
                </div>)
                : <div key={group_name}>{grouped_resps_divs}</div>}
            {leftover_resps_divs.length === 0 ? (<></>) : (
                <div key={'__unspecified_group'} className="response-group">
                    {leftover_resps_divs}
                </div>
            )}
        </>);
    };

    // Produce DIV elements grouped by selected vars
    const divs = groupByVars(responses, selected_vars, [], null);
    setResponses(divs);

  }, [multiSelectValue, multiSelectVars]);

>>>>>>> 00ea468 (Ensure LLM colors are unique and the same across nodes)
  const handleOnConnect = () => {
    // For some reason, 'on connect' is called twice upon connection.
    // We detect when an inspector node is already fetching, and disable the second call:
    if (is_fetching) return; 

    // Get the ids from the connected input nodes:
    const input_node_ids = inputEdgesForNode(id).map(e => e.source);

    is_fetching = true;

    // Grab responses associated with those ids:
    fetch(BASE_URL + 'app/grabResponses', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        body: JSON.stringify({
            'responses': input_node_ids,
        }),
    }).then(function(res) {
        return res.json();
    }).then(function(json) {
        if (json.responses && json.responses.length > 0) {
            setJSONResponses(json.responses);
        }
        is_fetching = false;
    }).catch(() => {
        is_fetching = false; 
    });
  }

  if (data.input) {
    // If there's a change in inputs...
    if (data.input != pastInputs) {
        setPastInputs(data.input);
        handleOnConnect();
    }
  }

  useEffect(() => {
    if (data.refresh && data.refresh === true) {
        // Recreate the visualization:
        setDataPropsForNode(id, { refresh: false });
        handleOnConnect();
    }
  }, [data, id, handleOnConnect, setDataPropsForNode]);

  return (
    <div className="inspector-node cfnode">
    <NodeLabel title={data.title || 'Inspect Node'} 
                nodeId={id}
                icon={'🔍'}
                customButtons={[
                    <button className="custom-button" key="export-data" onClick={() => exportToExcel(jsonResponses)}>Export data</button>
                ]} />
      <div className='inspect-response-container nowheel nodrag'>
        <LLMResponseInspector jsonResponses={jsonResponses} />
      </div>
      <Handle
        type="target"
        position="left"
        id="input"
        style={{ top: "50%", background: '#555' }}
        onConnect={handleOnConnect}
      />
    </div>
  );
};

export default InspectorNode;