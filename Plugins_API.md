# Plugins API

The plugins API is a unified interface tool for managing RF recording dataflow with the goal of standardizing inputs and outputs. The plugins API is planned to be converted to an Open API spec.

## Input Paramters
- Format Options
    - Complex IQ Array stored in a BLOB
- Datatype Options
    - Complex Signed 8-bit INT "ci8_le"
    - Complex Signed 16-bit INT "ci16_le"
    - Complex Signed 32-bit INT "ci32_le"
    - Complex Signed 32-bit float "cf32_le"
    - Complex Signed 32-bit float "cf64_le"

- Annotations List
    | Name | Type | Description |
    | ---- | ---- | ----------- |
    | UUID | string | A RFC-4122 compliant UUID string |
    | sample_rate | double | The sample index in the Dataset file at which this Segment takes effect |
    | center_freq | double | The center frequency of the signal in Hz |
    | custom_settings | dict | Key/Value pairs for function-specific settings |


## Output Parameters
- Format Options
    - Annotation List
    - Byte Array
- Annotations List
    | Name | Type | Description |
    | ---- | ---- | ----------- |
    | UUID | string | A RFC-4122 compliant UUID string |
    | sample_start | string | A RFC-4122 compliant UUID string |
    | sample_count | double | The number of samples that this Segment applies to |
    | freq_lower_edge | double | The frequency (Hz) of the lower edge of the feature described by this annotation |
    | freq_upper_edge | dict | The frequency (Hz) of the upper edge of the feature described by this annotation |
    | description | string | Identifier for signal classification |

# 
| 
