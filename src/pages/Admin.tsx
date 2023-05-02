import * as React from 'react';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Tab from 'react-bootstrap/Tab';
import Row from 'react-bootstrap/Row';
import Configuration from '../Components/Admin/Configuration';
import DataSources from '../Components/Admin/DataSources';
import Detectors from '../Components/Admin/Detectors';
import Users from '../Components/Admin/Users';

const Admin = () => {
  return (
    <Tab.Container defaultActiveKey="users">
      <Row>
        <Col sm={3}>
          <Nav className="flex-column">
            <Nav.Item>
              <Nav.Link eventKey="users">Users</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="data-sources">Data Sources</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="detectors">Detectors</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="configuration">Configuration</Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={9}>
          <Tab.Content>
            <Tab.Pane eventKey="users">
              <Users />
            </Tab.Pane>
            <Tab.Pane eventKey="data-sources">
              <DataSources />
            </Tab.Pane>
            <Tab.Pane eventKey="detectors">
              <Detectors />
            </Tab.Pane>
            <Tab.Pane eventKey="configuration">
              <Configuration />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
};

export default Admin;
