import vita49


def main():
    """This converter converts Vita49 compliant data into SigMF. Change the input path of the Vita49 file in "vita49_data_input.py" to the location of your binary vita49 file. Change the output path to the desired output location of the converted SigMF files (see example)
    All four python files "vita49_data_input.py", which is the main file, "vita49.py", which parses the vita compliant packets of the
    bytestream, vita_constants, containing the field sizes of vita49 and "Converter.py", which converts the read vita49 packets into SigMF, have to be in the same folder(or paths specified when importing).
    Currently, Vita49 data and context packets are supported. Other packet types are not supported but should be overread.
    For the Context packets, the CIf0 context field is implemented with most of its 32 context fields. Fields from Cif0 that are of type 
    11*32bits, 13*32bits or array of records, are not implemented but should be overread.
    Other Cif fields (CIF1, CIF2, CIF3, CIF7) are not implemented and may result in an error!
    For each different streamID for a context packet, a meta file is created. The Datafiles are matched to the context packets (metafiles)
    """

    vita49.convert_input("C:\\Users\\SIGENCE\\Documents\\Vita49_SigMF\\testdata\\keysight_OFDM\\custom_ofdm.vita49" , 'C:\\Users\\SIGENCE\\Documents\\Vita49_SigMF\\')

if __name__ == '__main__':
    main()