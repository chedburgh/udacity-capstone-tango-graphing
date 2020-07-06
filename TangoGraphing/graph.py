#!/usr/bin/env python3
import argparse
import io
import os
import tempfile
import base64

from graphviz import Graph, Source
from lxml import objectify

ns_xsi = "{http://www.w3.org/2001/XMLSchema-instance}"


def get_inherited_status(e):
    """
    Return the state of the inherited flag 
    """

    if e is None:
        raise("Error: get_inherited_status() called with None")

    if e.attrib["inherited"] == "true":
        return True

    return False


def get_access(e):
    """
    Get the elements access type and convert it to a shorter string
    """

    if e is None:
        raise("Error: get_access() called with None")

    if "rwType" not in e.attrib:
        raise("Error: Malformed xmi file. No rwType attribute on element")

    rw = ""

    if e.attrib["rwType"] == "READ":
        rw = "r"
    elif e.attrib["rwType"] == "WRITE":
        rw = "w"
    elif e.attrib["rwType"] == "READ_WRITE":
        rw = "rw"
    elif e.attrib["rwType"] == "READ_WITH_WRITE":
        rw = "rww"
    else:
        raise("Error: Unknown rwType value on element")

    return rw


def get_type(e):
    """ 
    Load an attribute type from the xmi XML data
    """

    if e is None:
        raise("Error: get_type() called with None")

    if ns_xsi + "type" not in e.attrib:
        raise("Error: Malformed xmi file. No type attribute on element")

    # extract the data type
    return e.attrib[ns_xsi + "type"].split("pogoDsl:", 1)[1].split("Type")[0]


def add_attribute(graph, e):
    """
    Process and add the details of an attribute to the graph
    """

    if e is None or graph is None:
        raise("Error: add_attribute() called with None parameter")

    if "\t" + e.attrib["attType"] not in graph.source:
        graph.attr("node", shape="octagon", style="filled", fillcolor="grey86")
        graph.edge("attributes", e.attrib["attType"], label="of type")
        graph.node(e.attrib["attType"], label=e.attrib["attType"], width="1", height="1")

    graph.attr("node", shape="record", style="filled", fillcolor="lightblue")

    graph.edge(e.attrib["attType"], e.attrib["name"] +
               e.attrib["attType"] + get_type(e.dataType), label="named")

    record = e.attrib["name"] + "|{{" + get_type(e.dataType) + "|" + get_access(e) + "}"

    if "memorized" in e.attrib:
        if e.attrib["memorized"] == "true":
            record += "|{memorized}"

    if e.attrib["attType"] == "Spectrum" or e.attrib["attType"] == "Image":
        record += "|{dim:" + e.attrib["maxX"] + "," + e.attrib["maxY"] + "}"

    if e.attrib["displayLevel"] == "EXPERT":
        record += "|{expert}"

    if get_inherited_status(e.status) == True:
        record += "|{inherited}"

    record += "}"

    graph.node(e.attrib["name"] + e.attrib["attType"] + get_type(e.dataType), record)


def add_command(graph, e):
    """
    Add a command node to the graph
    """

    if e is None or graph is None:
        raise("Error: add_command() called with None parameter")

    graph.attr("node", shape="record", style="filled", fillcolor="mistyrose")
    graph.edge("commands", e.attrib["name"] + "_CMD", label="named")

    record = e.attrib["name"] + \
        "|{{in:" + get_type(e.argin.type) + \
        "}|{out:" + get_type(e.argout.type) + "}"

    if e.attrib["displayLevel"] == "EXPERT":
        record += "|{expert}"

    if get_inherited_status(e.status) == True:
        record += "|{inherited}"

    record += "}"
    graph.node(e.attrib["name"] + "_CMD", record)


def add_state(graph, e):
    """
    Add a state node to the graph
    """

    if e is None or graph is None:
        raise("Error: add_state() called with None parameter")

    graph.attr("node", shape="oval", style="filled", fillcolor="darkolivegreen3")
    graph.edge("states", e.attrib["name"] + "_STATE", label="named")
    graph.node(e.attrib["name"] + "_STATE", label=e.attrib["name"], width="1", height="1")


def add_property(graph, e):
    """
    Add a property node to the graph
    """

    node_name = None

    if e.tag == "deviceProperties":
        node_name = "deviceProperties"

        if "\t" + node_name not in graph.source:
            graph.attr("node", shape="octagon", style="filled", fillcolor="grey86")
            graph.edge("properties", node_name, label="defines")
            graph.node(node_name, label="Device\nProperties", width="1", height="1")

    elif e.tag == "classProperties":
        node_name = "classProperties"

        if "\t" + node_name not in graph.source:
            graph.attr("node", shape="octagon", style="filled", fillcolor="grey86")
            graph.edge("properties", node_name, label="defines")
            graph.node(node_name, label="Class\nProperties", width="1", height="1")

    graph.attr("node", shape="record", style="filled", fillcolor="khaki")
    graph.edge(node_name, e.attrib["name"] + get_type(e.type) + "device" + node_name, label="named")
    record = e.attrib["name"] + "|{" + get_type(e.type)

    if hasattr(e, 'DefaultPropValue'):
        default_value = e.DefaultPropValue.text
        value = (default_value[:10] + "..") if len(default_value) > 10 else default_value
        record += "|{val: " + value + "}"

    if get_inherited_status(e.status) == True:
        record += "|{inherited}"

    record += "}"
    graph.node(e.attrib["name"] + get_type(e.type) + "device" + node_name, record)


def add_pipe(graph, e):
    """
    Add a pipe node to the graph
    """

    if e is None or graph is None:
        raise("Error: add_pipe() called with None parameter")

    graph.attr("node", shape="record", style="filled", fillcolor="wheat")
    graph.edge("pipes", e.attrib["name"] + "_PIPE", label="named")
    graph.node(e.attrib["name"] + "_PIPE", label=e.attrib["name"] + "|" + get_access(e))


def graph_xmi(xml_root):
    """ 
    Graph the device class using the graphviz engine, returning the result in
    graphviz DOT notation
    """

    device_class_name = xml_root.attrib["name"]

    graph = None

    # Declear the graph
    graph = Graph(name="Device Class Map")
    graph.attr("graph", layout="neato", overlap="false", root=device_class_name)

    # Add the device class
    graph.attr("node", shape="tripleoctagon", style="filled", fillcolor="grey94")
    graph.node(device_class_name, label=device_class_name + "\nDevice Server", width="2", height="2")

    for e in xml_root.iterchildren():
        if e.tag == "attributes":
            if "\tattributes" not in graph.source:
                graph.attr("node", shape="doubleoctagon", style="filled", fillcolor="grey90")
                graph.edge(device_class_name, "attributes", label="defines")
                graph.node("attributes", label="Attributes", width="1.3", height="1.3")

            add_attribute(graph, e)

        elif e.tag == "deviceProperties" or e.tag == "classProperties":
            if "\tproperties" not in graph.source:
                graph.attr("node", shape="doubleoctagon", style="filled", fillcolor="grey90")
                graph.edge(device_class_name, "properties", label="defines")
                graph.node("properties", label="Properties", width="1.3", height="1.3")

            add_property(graph, e)

        elif e.tag == "commands":
            if "\tcommands" not in graph.source:
                graph.attr("node", shape="doubleoctagon", style="filled", fillcolor="grey90")
                graph.edge(device_class_name, "commands", label="implements")
                graph.node("commands", shape="doubleoctagon", label="Commands", width="1.3", height="1.3")

            add_command(graph, e)

        elif e.tag == "states":
            if "\tstates" not in graph.source:
                graph.edge(device_class_name, "states", label="has")
                graph.node("states", shape="doubleoctagon", label="States",
                           fillcolor="grey90", width="1.3", height="1.3")

            add_state(graph, e)

        elif e.tag == "pipe":
            if "\tpipes" not in graph.source:
                graph.attr("node", shape="doubleoctagon", style="filled", fillcolor="grey90")
                graph.edge(device_class_name, "pipes", label="defines")
                graph.node("pipes", label="Pipes", width="1.3", height="1.3")

            add_pipe(graph, e)

    return graph


def xmi_to_dot(file_stream):
    """
    Convert a xmi file stream to dot notation and return it as text
    """

    file_stream.seek(0)
    root = objectify.fromstring(file_stream.read())
    graph = graph_xmi(root["{}classes"])
    return graph.source


def render_dot(dot, format):
    """
    Clunky means to render and return the dot string. We render to a temp
    file, then read that back in
    """

    # create a temporary file and render to it, we will then
    # load and return this file to the caller
    temp = tempfile.NamedTemporaryFile(delete=False)
    outfile_name = os.path.splitext(temp.name)[0]

    # create a graphviz source to hold the dot data and set
    # it to the requested format
    source = Source(dot)
    source.format = format

    # now render to the temp file, the render will add the extension based
    # on the format
    filepath = source.render(filename=outfile_name, format=format, cleanup=True)

    # flush to disk and close
    temp.flush()
    temp.close()

    file_stream = None

    # read the file back in
    with open(filepath, "rb") as fp:
        file_stream = io.BytesIO(fp.read())

    # now remove it
    if os.path.exists(filepath):
        os.unlink(filepath)

    # return the bytes
    return file_stream


def graph_file(file_stream, output_format):
    """
    Entry point, graph the given filestream and return the bytes of an image
    """

    # with a valid file, we can graph it, go ahead...
    dot = xmi_to_dot(file_stream)
    graph_bytes = render_dot(dot, output_format)

    return graph_bytes