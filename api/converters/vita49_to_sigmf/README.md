## Description

This converter converts Vita49 compliant data into SigMF. Change the input path of the Vita49 file to the location of your 

Currently, Vita49 data and context packets are supported. Other packet types are not supported but should be overread.
For the Context packets, the CIf0 context field is implemented with most of its 32 context fields. Fields from Cif0 that are of type 
11 * 32bits, 13 * 32bits or array of records, are not implemented but should be overread. 

Other Cif fields (CIF1, CIF2, CIF3) are not implemented but should be overread (testing only with synthetic dataset)
CIF7 fields may cause error.
For each different streamID for a context packet, a meta file is created. The Datafiles are matched to the context packets (metafiles)


## Example

    import vita49
    def main():
        vita49.convert_input("input_path" , "output_path")
    if __name__ == '__main__':
        main()

Always use double slashes for file paths

## Code Structure

For info about the packet format see https://www.mathworks.com/help/comm/ug/vita49-file-reader.html or the VITA specs themselves.

Currently, two packet types are implemented, the Vita49 data packet and the Vita49 context packet. All other packet types are not read but should be parsed over, without causing an error. Below, the implemented data packet structure is depicted.

From this structure all fields are read, indluding the trailer fields. The trailer fields are shown and interpreted but not used for the SigMF conversion (e.g. indiciator fields are taken from context packet not data packet).

In this packet, the Context Indicator Field #0 is a 32 bit number, indicating what type of context fields are included below. 

Data Packets without Context packets are perceived as invalid and not converted. This is partly because important information for a sensical conversion to SigMF, like sample rate, would be missing in the data packets alone.

If a Context packet is detected, the streamID is taken and the context information is written into a dictionary with the StreamID as key and context packet as value. If the StreamID already exists, the value is overwritten, if the StreamID does not exist yet, the key value pair is created.
When a data packet is detected, the important context information as well as the matching of SigMF data and Meta file is accomplished by checking the StreamID and taking the according context information from the dictionary, if a context packet with this StreamID has already occured. If no matching context packet is found, the data packet is perceived as invalid.
For each StreamID, one SigMF meta file is created. All data packets with this StreamID create one SigMF data file.
-> e.g. StreamID = 0x0 -> 0x0.sigmf-meta and 0x0.sigmf-data

## Limitations

- General
    - Data packets without context packets before are perseived as invalid. All necessary Information is taken from the context packet!
        - Currently: can stop program, tbd: throw invalid packet away
    - Timestamps are always taken form the Context packet
    - Currently, a meta file is only created once for each StreamID. Subsequently, if the meta information changes from different context packets, the StreamID should as well.

- Vita49
    - context:
        -CIF7 will result in an error
            - From Cif0: only fields 31-14 are read. Fields 13-0 are overread -> no error but not interpreted
        - no change in sample rate without change in streamID possible as sample rate defined as global in sigmf
            - If context information changes without a change in StreamID, the context information is wrong or outdated
        - Age and Shelf life in CIF3 hardcoded to 96bits (should be dependent on TSI and TSF flag
            - None: 32bit; Only TSI_32bit; Only TSF: 64bit; Both TSI and TSF:96bit )
    - Data:
        - Trailer Information currently disregarded
        - Timestamp fields and data payload fields barely tested because of lack of test data
        - Only complex cartesian, data format supported
- SigMF
	- output format fixed as complex float 32
	-  Sample rate is only allowed to change if the StreamID changes to a new StreamID as well

## TBD

- Revise Data format fields when more test data is availabe: conversion automatically done to cf32 -> might cause errors with some untested data formats
- Changable Sample rate for each capture
- implement CIF7 fields (or overread them without causing an error)
- Throw away invalid packets instead of throwing an error
- Test CIF1,CIF2,CIF3 with real test data
