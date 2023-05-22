# Plugins API

The plugins API is a unified open interface for managing the processing of RF recordings and corresponding dataflow, with the goal of standardizing inputs and outputs to RF processing functions for easy of interoperability and to combat vendor lockin. The plugins API is planned to be converted to an OpenAPI spec once its further refined.  It will use JSON for the fields.

## Input Parameters
- IQ Samples as an array, stored as a binary large object in some form (not within the JSON)
- The following fields:
    | Name | Type | Description |
    | ---- | ---- | ----------- |
    | UUID | string | A RFC-4122 compliant UUID string |
    | sample_rate | number | The sample index in the Dataset file at which this Segment takes effect |
    | center_freq | number | The center frequency of the signal in Hz |
    | custom_settings | object | Key/Value pairs for function-specific settings |
    | data_type | string | data type of IQ, see below |

Datatype Options, a subset of those in SigMF:
- Complex signed 8-bit int "ci8_le"
- Complex signed 16-bit int "ci16_le"
- Complex signed 32-bit int "ci32_le"
- Complex 32-bit float "cf32_le"
- Complex 64-bit float "cf64_le"

## Output
- Optional Byte Array in the form of a binary large object (e.g. the output of a modem)
- Annotations List, a list of the following objects:
    | Name | Type | Description |
    | ---- | ---- | ----------- |
    | UUID | string | A RFC-4122 compliant UUID string |
    | sample_start | number | A RFC-4122 compliant UUID string |
    | sample_count | number | The number of samples that this Segment applies to |
    | freq_lower_edge | number | The frequency (Hz) of the lower edge of the feature described by this annotation |
    | freq_upper_edge | number | The frequency (Hz) of the upper edge of the feature described by this annotation |
    | description | string | Identifier for signal classification |

