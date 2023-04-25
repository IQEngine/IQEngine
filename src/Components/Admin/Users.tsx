import React, { useState } from 'react';
import Table from 'react-bootstrap/Table';
import users from './users.json';

const Users = () => {

    const [data] = useState(users);

    return(
        <><h4>Users:</h4>
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Last Signed In</th>
                    <th>Allowed Sources</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {data.map((item) => (
                    <tr key={item.id}>
                        <td><input type="checkbox" /></td>
                        <td>{item.name}</td>
                        <td>{new Date(item.lastSignIn).toUTCString()}</td>
                        <td>
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                                {item.allowedSources.map((source, index) => (
                                    <React.Fragment key={index}>
                                        <div>{source}</div>
                                        {index !== item.allowedSources.length - 1 && <div>,&nbsp;</div>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </td>
                        <td></td>
                    </tr>
                ))}
            </tbody>
        </Table></>
    )
};

export default Users;