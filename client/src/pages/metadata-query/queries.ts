import moment from 'moment';
import { DateQuery } from "./DateQuery";
import { StringQuery } from "./StringQuery";
import { FreqQuery } from "./FreqQuery";
import { GeoQuery } from './GeoQuery';

export const queries = {
  date: {
    component: DateQuery,
    selected: true,
    description: "The date the document was created",
    validator: ({from, to}) => {
      let parsedTo = moment(to);
      let parsedFrom = moment(from);
      if ((parsedTo.isValid() && parsedFrom.isValid()) && parsedTo.isAfter(parsedFrom)) {
        return `min_datetime=${encodeURIComponent(parsedFrom.format())}&max_datetime=${encodeURIComponent(parsedTo.format())}`
      }
      return false;
    },
    value: ""  
  },
  geo: {
    component: GeoQuery,
    selected: false,
    description: "lat and long with radius for geo search",
    validator: ({lat, lon, radius}) => {
      return `geo_lat=${lat}&geo_long=${lon}&geo_radius=${radius}`;
    },
    value: ""  
  },
  author: {
    component: StringQuery,
    selected: false,
    description: "The author of the document",
    validator: (author: string) => {  
      if (!author) {
        return false;
      }
      return `author=${encodeURIComponent(author)}`;
    },
    value: ""
  },
  comment: {
    component: StringQuery,
    selected: false,
    description: "Comments contained in the annotation",
    validator: (comment: string) => {
      if (!comment) {
        return false;
      }
      return `comment=${encodeURIComponent(comment)}`;
    },
    value: ""
  },
  frequency: {
    component: FreqQuery,
    selected: true,
    description: "The frequency range to search over (Hz)",
    validator: ({from, to}) => {
      const parsedFrom: number = parseInt(from);
      const parsedTo: number = parseInt(to);
      if (parsedTo > 0 && (parsedFrom < parsedTo)) {
        return `min_frequency=${parsedFrom}&max_frequency=${parsedTo}`;
      }
      return false;
    },
    value: `min_frequency=30000000&max_frequency=300000000`
  },
  container: {
    component: StringQuery,
    selected: false,
    description: "The container the document is in",
    validator: (container: string) => {
      if (!container) {
        return false;
      }
      return `container=${encodeURIComponent(container)}`;
    },
    value: ""
  },
  label: {
    component: StringQuery,
    selected: false,
    description: "The label of the document",
    validator: (label: string) => {
      if (!label) {
        return false;
      }
      return `label=${encodeURIComponent(label)}`;
    },
    value: ""
  },
  text: {
    component: StringQuery,
    selected: false,
    description: "Full text search across valid fields",
    validator: (text: string) => {
      if (!text) {
        return false;
      }
      return `text=${encodeURIComponent(text)}`;
    },
    value: ""
  }
}