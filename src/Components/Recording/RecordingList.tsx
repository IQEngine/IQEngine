import React from "react";
import { RecordingObject } from "./Recording";

interface RecordingListProps {
    recordings: RecordingObject[]
}

const RecordingList = ({ recordings }: RecordingListProps) => {
    return (
        <table className="table table-striped">
            <thead>
                <tr>
                    <th scope="col">Source</th>
                    <th scope="col">Spectogram</th>
                    <th scope="col">Title</th>
                    <th scope="col">Samples</th>
                    <th scope="col">Frequency</th>
                    <th scope="col">Date</th>
                </tr>
            </thead>
            <tbody>
                {
                    recordings.map((recording) => (
                        <tr>
                            <td>{recording.source}</td>
                            <td><img src={recording.spectogram} alt="Spectogram" /></td>
                            <td>{recording.title}</td>
                            <td>{recording.samples}</td>
                            <td>{recording.frequency}</td>
                            <td>{recording.date}</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
     )
};

            export default RecordingList;