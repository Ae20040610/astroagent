"""
AstroAgent LangGraph Graph
"""

from dotenv import load_dotenv
load_dotenv()

from langgraph.graph import StateGraph, END
from agent.state import AstroState
from agent.nodes import (
    router_node,
    guardrail_node,
    reason_node,
    tool_executor_node,
    route_after_router,
    route_after_reason,
)


def build_graph() -> StateGraph:
    graph = StateGraph(AstroState)

    # Add nodes
    graph.add_node("router", router_node)
    graph.add_node("guardrail", guardrail_node)
    graph.add_node("reason", reason_node)
    graph.add_node("tools", tool_executor_node)

    # Entry point
    graph.set_entry_point("router")

    # Router → guardrail or reason
    graph.add_conditional_edges(
        "router",
        route_after_router,
        {
            "guardrail": "guardrail",
            "reason": "reason",
        }
    )

    # Guardrail → END
    graph.add_edge("guardrail", END)

    # Reason → tools or END
    graph.add_conditional_edges(
        "reason",
        route_after_reason,
        {
            "tools": "tools",
            "end": END,
        }
    )

    # Tools → reason (loop back)
    graph.add_edge("tools", "reason")

    return graph.compile()


# Singleton compiled graph
astro_graph = build_graph()
