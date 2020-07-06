#!/usr/bin/env python3

import pytest
from graphviz import Graph
from lxml import objectify, etree
from graph import get_inherited_status
from graph import get_access
from graph import get_type
from graph import add_attribute
from graph import add_command
from graph import add_state
from graph import add_pipe

def testCanAssert():
    assert True

class TestInheritedStatus:
    def test_returns_exception_on_none(self):
        with pytest.raises(Exception):
            get_inherited_status(None)
    
    def test_returns_true(self):
        root = objectify.fromstring("""<status abstract="false" inherited="true" concrete="true" concreteHere="true"/>""")
        assert get_inherited_status(root) == True
 
    def test_returns_false(self):
        root = objectify.fromstring("""<status abstract="false" inherited="false" concrete="true" concreteHere="true"/>""")
        assert get_inherited_status(root) == False

class TestGetAccess:
    def test_returns_r(self):
        root = objectify.fromstring('<attributes rwType="READ"/>')
        assert get_access(root) == "r"
    
    def test_returns_w(self):
        root = objectify.fromstring('<attributes rwType="WRITE"/>')
        assert get_access(root) == "w"
 
    def test_returns_rw(self):
        root = objectify.fromstring('<attributes rwType="READ_WRITE"/>')
        assert get_access(root) == "rw"
 
    def test_returns_rww(self):
        root = objectify.fromstring('<attributes rwType="READ_WITH_WRITE"/>')
        assert get_access(root) == "rww"
 
    def test_raises_exception_when_param_none(self):
        with pytest.raises(Exception):
            get_access(None)
 
    def test_raises_exception_when_rwType_missing(self):
        with pytest.raises(Exception):
            root = objectify.fromstring('<attributes/>')
            get_access(root)

    def test_raises_exception_when_rwType_unknown(self):
        with pytest.raises(Exception):
            root = objectify.fromstring('<attributes rwType="UNKNOWN"/>')
            get_access(root)

class TestGetType:
    def test_returns_type(self):
        root = objectify.fromstring('<dataType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="pogoDsl:ShortType"/>')
        assert get_type(root) == "Short"

    def test_raises_exception_when_param_none(self):
        with pytest.raises(Exception):
            root = objectify.fromstring(None)
            get_type(root)

    def test_raises_exception_when_type_missing(self):
        with pytest.raises(Exception):
            root = objectify.fromstring('<dataType xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>')
            get_access(root)

class TestAddAttribute:
    def test_raises_exception_when_graph_none(self):
        root = objectify.fromstring("<attribute/>")
        with pytest.raises(Exception):
            add_attribute(None, root)


    def test_raises_exception_when_root_none(self):
        graph = Graph(name="Device Class Map")
        with pytest.raises(Exception):
            add_attribute(graph, None)


    def test_scalar_node_added(self):
        xml = """<attributes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="cache_hits" attType="Scalar" rwType="READ" displayLevel="EXPERT" polledPeriod="0" maxX="" maxY="" allocReadMember="true" isDynamic="false">
                    <dataType xsi:type="pogoDsl:UIntType"/>
                    <status abstract="false" inherited="false" concrete="true" concreteHere="true"/>
                </attributes>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_attribute(graph, root)
        assert "\tScalar" in graph.source

    def test_spectrum_node_added(self):
        xml = """<attributes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="cache_hits" attType="Spectrum" rwType="READ" displayLevel="EXPERT" polledPeriod="0" maxX="2" maxY="2" allocReadMember="true" isDynamic="false">
                    <dataType xsi:type="pogoDsl:UIntType"/>
                    <status abstract="false" inherited="false" concrete="true" concreteHere="true"/>
                </attributes>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_attribute(graph, root)
        assert "\tSpectrum" in graph.source

    def test_node_name_correct(self):
        xml = """<attributes xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="cache_hits" attType="Scalar" rwType="READ" displayLevel="EXPERT" polledPeriod="0" maxX="" maxY="" allocReadMember="true" isDynamic="false">
                    <dataType xsi:type="pogoDsl:UIntType"/>
                    <status abstract="false" inherited="false" concrete="true" concreteHere="true"/>
                </attributes>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_attribute(graph, root)
        assert "\tcache_hitsScalarUInt" in graph.source

class TestAddCommand:
    def test_raises_exception_when_graph_none(self):
        root = objectify.fromstring("<commands/>")
        with pytest.raises(Exception):
            add_command(None, root)

    def test_raises_exception_when_root_none(self):
        graph = Graph(name="Device Class Map")
        with pytest.raises(Exception):
            add_command(graph, None)

    def test_node_added(self):
        xml = """<commands xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" name="ClearStats" description="Clear any gathered stats and debug" execMethod="clear_stats" displayLevel="EXPERT" polledPeriod="0" isDynamic="false">
                    <argin description="">
                        <type xsi:type="pogoDsl:VoidType"/>
                    </argin>
                    <argout description="">
                        <type xsi:type="pogoDsl:VoidType"/>
                    </argout>
                    <status abstract="false" inherited="false" concrete="true" concreteHere="true"/>
                </commands>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_command(graph, root)
        assert "\tClearStats_CMD" in graph.source

class TestAddState:
    def test_raises_exception_when_graph_none(self):
        root = objectify.fromstring("<states/>")
        with pytest.raises(Exception):
            add_state(None, root)

    def test_raises_exception_when_root_none(self):
        graph = Graph(name="Device Class Map")
        with pytest.raises(Exception):
            add_state(graph, None)

    def test_node_added(self):
        xml = """<states name="OFF" description="The text to speech server is OFF.">
                    <status abstract="false" inherited="false" concrete="true" concreteHere="true"/>
                </states>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_state(graph, root)
        assert "\tOFF_STATE" in graph.source

class TestAddPipe:
    def test_raises_exception_when_graph_none(self):
        root = objectify.fromstring("<pipes/>")
        with pytest.raises(Exception):
            add_pipe(None, root)

    def test_raises_exception_when_root_none(self):
        graph = Graph(name="Device Class Map")
        with pytest.raises(Exception):
            add_pipe(graph, None)

    def test_node_added(self):
        xml = """<pipes name="TestPipe" description="" label="" rwType="READ_WRITE" displayLevel="OPERATOR"/>"""

        root = objectify.fromstring(xml)
        graph = Graph(name="Device Class Map")
        add_pipe(graph, root)
        assert "\tTestPipe_PIPE" in graph.source

class TestAddProperty:
    def test_raises_exception_when_graph_none(self):
        root = objectify.fromstring("<deviceProperties/>")
        with pytest.raises(Exception):
            add_pipe(None, root)

    def test_raises_exception_when_root_none(self):
        graph = Graph(name="Device Class Map")
        with pytest.raises(Exception):
            add_pipe(graph, None)
