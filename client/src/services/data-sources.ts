import axios from 'axios';

export class DataSourceAPI {
  static async PutMetadata(datasource_id, file_path, meta): Promise<string> {
    const url = `/api/datasources/${datasource_id}/${file_path}/meta`;

    return axios
      .put(url, meta)
      .then((response) => {
        if (response.status === 201) {
          return response.data;
        } else {
          return {};
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
