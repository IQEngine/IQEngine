import dataclasses
import ctypes
from typing import Tuple, Union, Optional
from io import BytesIO
import io
import struct
import numpy as np
import matplotlib.pyplot as plt
import logging
from pprint import pprint
from vita_constants import *
from Converter import match_context_packet, get_context_packet, CurrentContextPacket

####dataclasses Packet structure####
@dataclasses.dataclass
class Header:
    """ > class for header(everything until including fract. timestamp (same for context and data))
    
    # *Attributes - First Word:*
    
    - packet_type: (4bit) 0 -> da ta packet without StreamID, 1 -> data packet with StreamID, 4 -> context packet
    
    - C: (1bit) 1 -> Class fields (Second Word) present, 0 -> Class fields (Second Word) not present
    
    - indicators(3bit): 
    
        > indicators[0]: 0 -> no Trailer, 1 -> Trailer included
    
        > indicators[1]: 0 -> IS a Vita49.0 packet, 1 -> is NOT a Vita49.0 packet
           
        > indicators[2]: 0 -> Signal Time Data, 1 -> Signal Spectrum Data
                        
    - TSI: (2bit):
        
        > 00 -> no int timestamp included
        
        > 01 -> UTC
        
        > 10 -> GPS time
        
        > 11 -> other  
    
    - TSF: (2bit):
    
        > 00 -> no fract timestamp included
        
        > 01 -> sample count timestamp
        
        > 10 -> Real time (picoseconds) timestamp
        
        > 11 -> Free running count timestamp
    
    - packet_count: (4bit) packet count from 0-15, when 15(1111) reached, packet_count reset to 0(0000)
    
    - packet_size: (16bit) packet size (in 32bit words) including ALL fields (also header, etc)
        
    # *Attributes - Second Word:* 
     
    > (mandatory for context packets, optional for data packets)
    
    - stream_identifier: (32bit) for multiplexing of multiple channels. Context packets and data packets with same stream ID belong to each other
        
    # *Attributes - Third Word(optional)*
    
    - pad_bit_count: (5bit) difference between the nearest multiple of 32 and the actual number of payload bits to pack
    
    - reserved: (3bit) reserved bits in vita standard are always 0
    
    - oui: (24bit) Organizationally unique identifier
    
    - information_class_code: (16bit) -
    
    - packet_class_code: (16bit) -
    
    # *Attributes - Fourth Word (optional):*
    
    - integer_seconds_timestamp: (32bit) as described by TSI indicator
        
    # *Attributes - Fifth Word (optional):*
    
    - fractional_seconds_timestamp: (64bit) as described by TSF indicator
    """
    packet_type: int = 0
    C: int = 0
    indicators: str = ""
    TSI: int = 0
    TSF: int = 0
    packet_count: int = 0
    packet_size: int = 0
    
    stream_identifier: ctypes.c_uint32 = 0
    
    pad_bit_count: int = 0
    reserved: int = 0
    oui: int = 0
    information_class_code: int = 0
    packet_class_code: int = 0
        
    integer_seconds_timestamp: ctypes.c_uint32 = 0
    
    fractional_seconds_timestamp: ctypes.c_uint64 = 0
    
@dataclasses.dataclass
class Context:
    """ > class for only context data (starting after frac timestamp). Currently only Cif0 is supported!
    
    # **Attributes**: 
    
    - *cif_indicator_field:*
    
    32 bit number of indicator flags. 1 means that context field is included in payload after cif indicator fields.
    each context field is represented by one flag in the cif0_indicator field. The order of fields matches the order
    used below.
    
    - *context_field_change_indicator:*
    
    1 if context data compared to last context packet has changed, 0 if not. Sending context packets even though
    no changes occured can be sensical to have a continuous stream of context data
                                    
    - *reference_point_identifier:*
    
    conveys the SID of a reference point. It contains the StreamID assigned to the reference point
    
    - *bandwidth:*
    
    bandwidth of the signal
    
    - *if_reference_frequency:*
    
    The spectral band described by the bandwidth is typically symmetrical around the IF reference frequency -> center frequency. If asymmetrical, IF band offset necessary
    
    - *rf_reference_frequency:*
    
    original reference frequency before down conversion
    
    - *rf_reference_frequency_offset:*
    
    *RF reference frequency + RF reference frequency offset ---Frequency Translation---> IF reference frequency*
    
    - *if_band_offset:*
    
    *Band Center = IF reference frequency + IF band offset*
    
    - *reference_level:*
    
    power of signal in dBm
    
    - *gain:*
    
    Gain of Signal in dB
    
    - *over_range_count:*
    
    --
    
    - *sample_rate:*
    
    rate of how the original signal is sampled
    
    - *timestamp_adjustment:*
    
    adjusts timestmap in header (header timestmap normally first sample in packet) to account for analog and digital system delays 
    
    - *timestamp_calibration_time:*
    
    date and time at which the timestamp in the data and context packets was known to be correct
    
    - *temperature:*
    
    Temperature in °C
    
    - *device_identifier:*
    
    
    
    - *state_event_indicators:*
    
    - *signal_data_packet_payload_format:*
    
    - *formatted_gps:*
    
    - *formatted_ins:*
    
    - *ecef_ephemeris:*
    
    - *relative_ephemeris:*
    
    - *ephemeris_ref_id:*
    
    - *gps_ascii:*
    
    - *context_association_lists:*
    
    - *field_attributes_enable:*
    
    --
    
    - *context_field_reserved:*
    
    reserved as 0
    
    - *context_field_enable:*
    
    Enables other cif indicator fields (32 bit fields after cif0 indicator field if enabled). In these fields further Context Fields can be enabled
    
    - *context_field_reserved2:*
    
    reserved as 0
    
    """
    cif_indicator_field = []
    
    context_field_change_indicator: bool = False
    reference_point_identifier:ctypes.c_uint32 = None
    bandwidth:ctypes.c_uint64 = None
    if_reference_frequency:ctypes.c_uint64 = None
    rf_reference_frequency:ctypes.c_uint64 = None
    rf_reference_frequency_offset:ctypes.c_uint64 = None
    if_band_offset:ctypes.c_uint64 = None
    reference_level:ctypes.c_uint32 = None
    gain:ctypes.c_uint32 = None
    over_range_count:ctypes.c_uint32 = None
    sample_rate:ctypes.c_uint64 = None
    timestamp_adjustment:ctypes.c_uint64 = None
    timestamp_calibration_time:ctypes.c_uint32 = None
    temperature:ctypes.c_uint32 = None
    device_identifier:ctypes.c_uint64 = None
    state_event_indicators:ctypes.c_uint32 = None
    signal_data_packet_payload_format:ctypes.c_uint64 = None
    formatted_gps:None = None
    formatted_ins:None = None
    ecef_ephemeris:None = None
    relative_ephemeris:None = None
    ephemeris_ref_id:ctypes.c_uint32 = None
    gps_ascii:None = None
    context_association_lists:None = None
    field_attributes_enable:ctypes.c_uint32 = None
    context_field_reserved:str = "0"#occurs 3 times (index 4,5,6(from specification, reverse as python index))
    context_field_enable:str = "0"#occurs 3 times (index 1,2,3(from specification, reverse as python index))
    context_field_reserved2:str = "0"#occurs once (index 0(from specification, reverse as python index))
    
    class_atr = []
    
    class_types = []
    
    included_fields = []

@dataclasses.dataclass
class Data:
    """ > class for only data and possibly trailer (starting after frac timestamp)
    
    # Attributes:
    
        iq_data: iq data as numpy array of I+jQ samples
        
        trailer: 4byte trailer if present
    """
    iq_data = None
    trailer:Optional[dict] = None

@dataclasses.dataclass
class Packet:
    """ > Class for whole packet (one packet)
    
    # Attributes:
    
        header: header of any packet (All fields up to including fractional timestamp)
        
        body: Either context fields or data fields(+trailer)
    """
    
    header: Header = dataclasses.field(default_factory=lambda: Header())
    body: Union[Context, Data] = None #either context or data
        
####Methods for parsing packets####
def parse(bs: bytes, current_context_packet_dict: CurrentContextPacket) -> Tuple[bool, Packet, int]:
    """ > function parses one packet

    :param bytes bs: bytestream from one packet
    
    :param  current_context_packet: CurrentContextPacket. Dictionary initialized in main with all current context information(most recent of each occured StreamID)
    
    :return Tuple[bool, Packet, int]: success indicator (True/False); Packet: One packet with all parsed information, index: currently parsed index in bytestream
    
    (index: start of next bytestream)
    """
    packet = Packet()
    
    current_context_packet = None
    index = 0
    #get header information(up to including fractional timestamp) for either context or data packet
    [success, packet.header, index] = parse_header(bs[index:])
    #if unparsable packet, this index is necessary as it has to be subtracted from the packet size to know how many more bits have to be skipped
    buff_ind = index
    if not success:
        raise Exception ("Parsing header was unsuccessful!")
    else:
        #get body information
        if packet.header.packet_type == 4:
            #context packet
            [success, packet.body, length] = parse_context(bs[index:])
            index += length
            #test if all data has been read
            all_data_read(packet.header, index)
            #save Context packet in dict, sorted by streamID
            match_context_packet(packet, current_context_packet_dict)
            if not success:
                raise Exception ("Parsing context fields was unsuccessful!")
        elif packet.header.packet_type == 0 or packet.header.packet_type == 1:
            #data packet with or without streamID
            [success, packet.body, index] = parse_data(packet.header, bs[index:], index, current_context_packet_dict)
            #return value is index not length (as in context), hence no addition of length to index necessary!
            #test if all data has been read
            all_data_read(packet.header, index)
            #current_context_packet = get_context_packet(packet.header, current_context_packet_dict)
            #print("CURRENT CONTEXT PACKET:")
            #pprint(current_context_packet)
            if not success:
                raise Exception ("Parsing data fields was unsuccessful!")
        else:
            print("Packet Type %1i is currently not supported. Only packet types 0,1 and 4 are supported" % packet.header.packet_type)
            #parse first hedaer field
            #[success, hdr_first_field, index] = parse_bits32(bs[index:], True)
            #find size of unsupported packet
            #packet_size = hdr_first_field[16:32]
            #subtract buff_ind(index after header) because this part of the packet size has already been read
            packet_size = packet.header.packet_size
            #index += (int(packet_size,2)*4) - buff_ind
            index = packet_size*4-buff_ind
            print("assumed index of unsupported type is: ")
            print(packet_size)
            print(index)
            packet.body = 1
            #skip packet
    return [success, packet, index]
          
def parse_header(bs: bytes) -> Tuple[bool, Header, int]:
    """ > parses header up to including fractional timestmap

    :param bytes bs: bytestream from [index:] to end
    
    :return Tuple[bool, Header, int]: success indicator (True/False); Header: Header with all parsed information up to including fractional
    
    timestamp, index: currently parsed index in bytestream (index: start of next bytestream)
    """
    header = Header()
    success = False
    
    #first word/32 bit (normal header):
    index = 0
    [success, value, length] = parse_bits32(bs[index:], True)
    index += length
    
    header.packet_type = int(value[0:4], 2)
    header.C = value[4]
    header.indicators = value[5:8]
    header.TSI = value[8:10]
    header.TSF = value[10:12]
    header.packet_count = int(value[12:16],2)
    header.packet_size = int(value[16:32],2)
    if not success:
        return (False, None, 0)
    
    #second word -> streamID (if present(required for context packet))
    if header.packet_type == 0:#type 0-> data packet no stream ID
        header.stream_identifier = None
    elif header.packet_type == 1 or header.packet_type == 4:#type 1-> data packet with StreamID//type4: context packet, streamID mandatory
        [success, value, length] = parse_bits32(bs[index:], True)
        header.stream_identifier = hex(int(value, 2))
        index += length

    if not success:
        return (False, None, 0)
    
    #third word -> ClassID
    if header.C == "0":
        #Class ID not present
        header.pad_bit_count = None
        header.reserved = None
        header.oui = None
        header.information_class_code = None
        header.packet_class_code = None
    else:
        #Class ID present
        [success, value, length] = parse_bits64(bs[index:], True)
        header.pad_bit_count = int(value[0:5],2)
        header.reserved = value[5:8]
        #header.oui = hex(int(value[8:32],2))
        header.oui = hex(int(value[0:32],2))
        header.information_class_code = hex(int(value[32:48],2))
        header.packet_class_code = hex(int(value[48:64],2))
        index += length
        
    if not success:
        return (False, None, 0)
        
    #fourth word -> int timestamp
    if header.TSI == "01" or header.TSI == "10" or header.TSI == "11":
        #later implement UTC, GPS, etc.
        [success, value, length] = parse_bits32(bs[index:], True)
        header.integer_seconds_timestamp = int(value,2)
        index += length
    else:
        #no int timestamp resent
        header.integer_seconds_timestamp = None
        
    if not success:
        return (False, None, 0)
    
    #fith word -> fract timestmap
    if header.TSF == "01" or header.TSF == "10" or header.TSF == "11":
        [success, value, length] = parse_bits64(bs[index:], True)
        header.fractional_seconds_timestamp = int(value, 2)
        index += length
    else:
        header.fractional_seconds_timestamp = None  

    if not success:
        return (False, None, 0)
    else:
        return (success, header, index)

def parse_context(bs: bytes) -> Tuple[bool, Context, int]:
    """ > parses context payload (from excluding fract timestamp to end of packet)

    :param bytes bs: bytestream from [index:] to end
    
    :return Tuple[bool, Context, int]:  success indicator (True/False); Context: Context body with all parsed context information until eof,
    
    index: currently parsed index in bytestream (index: start of next bytestream)
    """
    context = Context()
    success = False
    
    index = 0
    #parse cif0 indicator field
    
    #####? Value is not overwritten but appended, is kept over multiple object instances. Why? is attribute of object, should be reinitialized every time?
    context.included_fields = []
    [success, cif0_indicator_field, length] = parse_bits32(bs[index:], True)
    index += length
    j = 0
    for i in cif0_indicator_field:
        if(i == "1"):
            #appends indices of included fields to list
            context.included_fields.append(j)
        j+= 1
        
    #write class atributes in list with correct index(index in class_attributes corresponding to according cif0_indicator_field)
    for f in dataclasses.fields(context):
        #context.class_atr.append(f.name)
        if f.name == "context_field_reserved":
            for i in range(2):
                #3bits in a row are reserved
                context.class_atr.append(f.name)
                context.class_types.append(f.type)
        if f.name == "context_field_enable":
            for i in range(2):
                #3bits in a row are enables
                context.class_atr.append(f.name)
                context.class_types.append(f.type)
        context.class_atr.append(f.name)
        context.class_types.append(f.type)

    #check if cif0 indicator field is valid (is exactly 32 bit long)
    if len(cif0_indicator_field) == 32:
        #adjust index with +4,+8 or +12 bytes, depending on what cif enable fields are active(they are positioned after cif0 indicator field and have to be skipped)
        #It is sufficient to only read past the other cif enable fields as the cif context fields come after cif0 context fields and can just eb disregarded
        en_count = 0
        for en in context.included_fields:
            #test here, not in loop below because index has to be adjusted before the first context field is parsed!
            if en == 30 or en == 29 or en == 28: 
                en_count += 1
        index += en_count*4
        #parse through 32 bit cif0 indicator fields
        for i in context.included_fields:
            if (i == 31 or i == 27 or i == 26 or i == 25):
                logging.warning("reserved bit was 1. Invalid Packet structure")
                print("reserved bit was 1. Invalid Packet structure")
                #check datatype
            elif (i == 30 or i == 29 or i == 28 ):
                logging.warning("Cif enables were 1. Only Cif0 implemented currently!")
                print("Cif enables were 1. Only Cif0 implemented currently!")
            else:
                if (context.class_types[i] == ctypes.c_uint32):
                    [success, value, length] = parse_bits32(bs[index:], True)
                    #check if "special" field(not just decimal but with indicator flags and enables, etc.)
                    if context.class_atr[i] == "state_event_indicators":
                        value = show_state_event_indicators(value)
                    elif context.class_atr[i] == "temperature":
                        value = show_temperature(value)
                    else:
                        #convert value into human readable decimal
                        value = int(value, 2)
                        #print(value)
                        value /= 2.0 ** 7
                    setattr(context, context.class_atr[i], value)
                    index += length
                elif(context.class_types[i] == ctypes.c_uint64):
                    [success, value, length] = parse_bits64(bs[index:], True)
                    #check if "special" field(not just decimal but with indicator flags and enables, etc.)
                    if context.class_atr[i] == "device_identifier":
                        value = show_device_identifier(value)
                    elif context.class_atr[i] == "signal_data_packet_payload_format":
                        value = show_signal_data_packet_payload_format(value)
                    else:
                        #convert value into human readable decimal
                        value = int(value, 2)
                        #readable decimal (64 bit signed with radix point after 20th bit from MSB)
                        value /= 2.0 ** 20
                    setattr(context, context.class_atr[i], value)
                    index += length
                elif(context.class_types[i] is None):
                    if (i == 20 or i == 18 or i == 17):
                        #11*32 bit field, not parsed currently just "overread"
                        setattr(context, context.class_atr[i], None)
                        index += int(CONTEXT_FIELD_COMPLICATED/8)
                    elif(i == 19):
                        #13*32 bit field, not parsed currently just "overread"
                        setattr(context, context.class_atr[i], None)
                        index += int(CONTEXT_FIELD_ECEF/8)
                    elif(i == 22 or i == 23):
                        #array of records field, not parsed currently just "overread". -> parse only packet size to then skip this size in field
                        #Adjust size, only information that needs to be parsed from AOR
                        #SizeofArray if first word (32bit) from structure. SizeofArray describes size of 
                        #AOR including header(and SizeofArray field itself)
                        SizeofArray_bytes = bs[index:(index+4)]
                        SizeofArray = int.from_bytes(SizeofArray_bytes, 'big')
                        print("Array of Records data structure not implemented! Field skipped in packet")
                        index += SizeofArray*4
                        setattr(context, context.class_atr[i], None) 
                if not success:
                    return (False, None, 0)
    
    else:
        
        return (False, None, 0)
    #pprint(context)
    #read past other cif enable fields#
    
    return (success, context, index)

def parse_data(header: Header, bs: bytes, index:int, current_context_packet_dict: CurrentContextPacket) -> Tuple[bool, Data, int]:
    """ > parses data payload (from excluding fract timestamp to end of packet)

    :param bytes bs: bytestream from [index:] to end
    
    :param int index: current index in bs
    
    :return Tuple[bool, Data, int]: success indicator (True/False); Data: Data body with all parsed data information(Iq data, possibly trailer) until eof,
    
    index: currently parsed index in bytestream (index: start of next bytestream)
    """
    data = Data()
    #get current fitting context packet
    current_context_packet = get_context_packet(header, current_context_packet_dict)
    #parses payload+trailer(if present) of data packet
    success = False
    #Check if Trailer present
    if header.indicators[0] == "0":
        #Trailer not present
        trailer = None
        length = header.packet_size*4-index
        [success, value, length] = parse_to_index(bs, length)#bs is already from index: because called in parse with correct index
        iqdata = value
        index += length
    else:
        #Trailer present
        length = header.packet_size*4-index-4#remove last 4 bytes for trailer
        #Parse payload up to trailer
        [success, value, length] = parse_to_index(bs, length)#bs is already from index: because called in parse with correct index
        iqdata = value
        #Parse trailer (1 word)
        index += length
        [success, value, length] = parse_bits32(bs[-4:], True)
        index += length
        trailer = value
    if not success:
        return (False, None, 0)
    
    #show indicator fields in trailer
    trailer_dict = show_trailer_fields(trailer)
    
    #Plot data
    plot_data(current_context_packet, header, data, iqdata)
    
    data.trailer = trailer_dict

    return (success, data, index)

def parse_bits32(bs: Union[bytes,BytesIO], basic: bool) -> Tuple[bool, bytes, int]:
    """ > parses any 32bit field from bytestream bs

    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end
    
    :param basic bool: True -> normal field; False -> radix point and sign
    
    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as 32 bit binary of read field,
    
    length: length of parsed field (here: 32bit -> 4byte) -> next field starts at index+length
    """
    success = False
    if bs is None:
        #check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = io.BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= 4:
        #check if byte stream is long enough (>=4bytes -> >=32bits)
        idbuf = stream.read1(4)
        if basic is True:
            (value,) = struct.unpack(">I", idbuf)
            #return value as 32bit binary
            value = bin(value)[2:].zfill(32)
        elif basic is False:
            (value,) = struct.unpack(">i", idbuf)
            #remove "b"
            value = bin(value)
            value = value.replace('-', '')
            value = value.replace('b', '').zfill(32)
        #stream.seek(4) #backup to 4
        success = True
    else:
        success = False
    
    return((success, value, 4))

def parse_bits64(bs: Union[bytes,BytesIO], basic: bool) -> Tuple[bool, bytes, int]:
    """ > parses any 64bit field from bytestream bs

    :param basic bool: True -> normal field; False -> radix point and sign
    
    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end
    
    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as 64 bit binary of read field,
    
    length: length of parsed field (here: 64bit -> 8byte) -> next field starts at index+length
    """
    success = False
    if bs is None:
        #check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = io.BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= 8:
        #check if byte stream is long enough (>=8bytes -> >=64bits)
        idbuf = stream.read1(8)
        if basic is True:
            (value,) = struct.unpack(">Q", idbuf)
            value = bin(value)[2:].zfill(64)
        elif basic is False:
            (value,) = struct.unpack(">q", idbuf)
            #remove "b"
            value = bin(value)
            value = value.replace('-', '')
            value = value.replace('b', '').zfill(64)
        #stream.seek(8) #backup to 4 to re-include stream id in data for decoding below
        success = True
    else:
        success = False
        #return (success, "", 0)
    #return value as 64bit binary
    return((success, value, 8))
    
def parse_to_index(bs: Union[bytes,BytesIO], length: int) -> Tuple[bool, bytes, int]:
    """ > parses any field from bytestream bs from 0
    
    (not necessarily whole bs, e.g. not if bs given is bs[index:] in other function) to length of field(length of packet)

    :param Union[bytes,BytesIO] bs: bytestream from [index:] to end
    
    :param int length: _description_: length -> data parsed up to :length
    
    :return Tuple[bool, bytes, int]: success indicator (True/False); value: value as bit binary of read field (from given bs start to length),
    
    length: length of parsed field -> next field starts at index+length
    """
    success = False
    if bs is None:
        #check if bs is empty
        print("packet received, but data empty.")
        return
    if type(bs) is bytes:
        stream = io.BytesIO(bs)
    else:
        stream = bs
    if len(bs) >= length:
        #check if byte stream is long enough
        idbuf = stream.read1((length))
        value = idbuf[:length]#bs given is from index ->index position preceived as 0(because e.g. parse_data called with bs[index:] -> in parse_data bs stats with index:)
        stream.seek(0, 0) #backup to beginning of bs
        success = True
    else:
        success = False
    #return value as raw byte stream
    return(success, value, (length))


#####Functions to read out more information from certain fields(e.g. indicator fields)#####
def show_trailer_fields(bs: bytes) -> dict:
    """ > The trailer field is exactly 1 word long. It can contain indicator fields and enables which are defined below

    :param bytes bs: bytestream of trailer, has to be trailer field and exactly 32 bit long
    
    :return dict: return trailer field as dictionary with key(Indicators)-value(enables) pairs
    
    trailer fields are structured as follows:
    
    en          name                          pos.bit
    
    31          calibrated time indicator     19
    
    30          valid data indicator          18
    
    29          Reference Lock indicator      17
    
    28          AGC/MGC indicator             16    -> AGC: Automatic Gain Control; MGC: Manual Gain Control
    
    27          Detected signal indicator     15
    
    26          Spectral Inversion Indicator  14
    
    25          Over range indicator          13
    
    24          Sample loss indicator         12
    
    23          Sample Frame Indicator        11
    
    22          User Defined                  10
    
    21          User Defined                  9
    
    20          User Defined                  8
    
    --------------------------------------------
    7: E -> 1 Associated Contex Packet Count shall be provided; 0 -> Associated Contex Packet Count shall not be provided
    
    6..0: Associated Context Packet Count
    """
    if bs is not None:
        #trailer is included
        if len(bs) < 32:
            #check if trailer is 4 bytes long
            pass
            #exception
        else:
            #index 0 is bit 31
            trailer = bs
            indicator_values = [False, False, False, False, False, False, False, False, False, False, False, False, False]
            j = 0
            for i in trailer[0:12]:
                if i == "1":
                    indicator_values[j] = True
                j +=1                                
            #write as dictionary,
            trailer_dict = {
                "raw_value" :   trailer
                ,"calibrated_time_indicator": indicator_values[0]
                ,"valid_data_indicator": indicator_values[1]
                ,"reference_lock_indicator": indicator_values[2]
                ,"AGC/MGC_indicator": indicator_values[3]
                ,"Detected_signal_indicator": indicator_values[4]
                ,"spectral_inversion_indicator": indicator_values[5]
                ,"over_range_indicator": indicator_values[6]
                ,"sample_loss_indicator": indicator_values[7]
                ,"sample_frame_indicator": indicator_values[8]
                ,"User_defined" : indicator_values[9:12]
                ,"E" : indicator_values[12]
                ,"Associated_Context_packet_count" : trailer[-7:]
            }
            return trailer_dict
        
def show_device_identifier(bs: bytes) -> dict:
    """  > Device identifier(64bit) -> structured as follows:
    
            word 1: first 8 bit reserved, Manufacturer OUI last 24 bit
            
            word 2: first 16 bit reserved, Device Code last 16 bit

    :param bytes bs:  bytestream, exactly 64 bit long
    
    :return dict: dictionary of fields: key -> field name; value: actual value
    """
    value = bs
    rsvd1 = value[0:8]
    oui = value[8:32]
    rsvd2 = value[32:48]
    device_code = value[48:64]
    #check if reserved fields are 0 as specified by vita49.2
    #Mistake in dataset, reserved are not 0, so warning is not because of wrong parsing of 
    if(rsvd1 != "00000000" or rsvd2 != "0000000000000000"):
        print("WARNING: reserved bits in Device identifier field are NOT 0. They are reserved as 0 by Vita49.2 specification")
    
    #write as dictionary
    dev_id =  {
        "raw_value" :   hex(int(value,2))
        ,"rsvd1 (should be 0's)" : rsvd1
        ,"rsvd2 (should be 0's)" : rsvd2
        ,"oui" : oui
        ,"device_code" : device_code
    }
    return dev_id

def show_temperature(bs: bytes) -> float:
    """ > normal field except reserved bits at front, reserved bits removed, temperature field from bit 16-32 evaluated like normal 32 bit field

    :param bytes bs:  bytestream of temperature field and exactly 32 bit long
    
    :return float: temperature value
    """
    #temperature
    value = bs
    rsvd = value[0:16]
    temperature = int(value[16:32],2)
    temperature /= 2.0 ** 7
    
    #check if reserved fields are 0 as specified by vita49.2
    if(rsvd != "0000000000000000"):
        print("WARNING: reserved bits in Device identifier field are NOT 0. They are reserved as 0 by Vita49.2 specification")
    
    return temperature

def show_state_event_indicators(bs: bytes) -> dict:
    """    > State/Event Indicators are structured as follows:
    
    en          name                          pos.bit
    
    31          calibrated time indicator     19
    
    30          valid data indicator          18
    
    29          Reference Lock indicator      17
    
    28          AGC/MGC indicator             16
    
    27          Detected signal indicator     15
    
    26          Spectral Inversion Indicator  14
    
    25          Over range indicator          13
    
    24          Sample loss indicator         12
    
    23->20res.                                11->8
    
    7->0 user

    :param bytes bs: bytestream of state and event indicator field and exactly 32 bit long
    
    :return dict: return state and event indicator field as dictionary with key(Indicators)-value(enables) pairs
    """

    #index 0 is bit 31
    value = bs
    
    indicator_values = [False, False, False, False, False, False, False, False]
    j = 0
    for i in value[0:8]:
        if i == "1":
            indicator_values[j] = True
        j +=1                                
    #write as dictionary,
    #overwrite value written into self.cif0_field_values before
    val = {
        "raw_value" :   hex(int(value,2))
        ,"calibrated_time_indicator": indicator_values[0]
        ,"valid_data_indicator": indicator_values[1]
        ,"reference_lock_indicator": indicator_values[2]
        ,"AGC/MGC_indicator": indicator_values[3]
        ,"Detected_signal_indicator": indicator_values[4]
        ,"spectral_inversion_indicator": indicator_values[5]
        ,"over_range_indicator": indicator_values[6]
        ,"sample_loss_indicator": indicator_values[7]
    }
    
    return val

def show_signal_data_packet_payload_format(bs: bytes) -> dict:
    """   > Signal Data Packet Payload Format
    
    First word
    
    Bit pos------------#name--------------------------------#field width[bits]
    
    31-----------------packing_method-----------------------#1
    
    30-29--------------real_complex_type--------------------#2
    
    28-24--------------data_item_format---------------------#5
    
    23-----------------sample_component_repeat_indicator----#1
    
    22-20--------------event_tag_size-----------------------#3
    
    19-16--------------channel_tag_size---------------------#4
    
    15-12--------------data_item_fraction_size--------------#4
    
    11-6---------------item_packaging_field_size------------#6
    
    5-0----------------data_item_size-----------------------#6
    
    Second word
    
    31-16--------------repeat_count-------------------------#16
    
    15-0---------------vector_size--------------------------#16
    
    see more under vita49.2 spec 9.13.3
    
    !!More fields to be implemented as well as effect on evaluation of data packets!!

    :param bytes bs:  bytestream of signal data packed payload field and exactly 64 bit long
    
    :return dict: dict of signal data packet payload format
    """
    value = bs

    packing_method = value[0]
    if(packing_method == "0"):
        packing_method = "processing_efficient_packaging"
    elif(packing_method == "1"):
        packing_method = "link_efficient_packaging"
        
    real_complex_type = value[1:3]
    if(real_complex_type == "00"):
        real_complex_type = "Real"
    elif(real_complex_type == "01"):
        real_complex_type = "Complex_cartesian"
    elif(real_complex_type == "10"):
        real_complex_type = "Complex_polar"
    elif(real_complex_type == "11"):
        real_complex_type = "Reserved"
        
    data_item_format = value[3:8]
    data_item_size = value [26:32]
    packing_field_size = value[20:26]
    if(data_item_format == "00000"):
        data_item_format = "Signed_Fixed_Point"
        if data_item_size == "10000":
            data_item_size = 16
            packing_field_size = 16
        else:
            data_item_size = 32
    elif(data_item_format == "10000"):
        data_item_format = "Unsigned_Fixed_Point"
    elif(data_item_format == "00111"):
        data_item_format= "Signed_Fixed_point_Non_Normalized"
    elif(data_item_format == "01110"):
        data_item_format = "Single_Precision_Floating_Point"
        data_item_size = 32
        packing_field_size = 32
    else:
        data_item_format = "Other"
        data_item_size = 16
        packing_field_size = 16
        
    sample_component_repeat_indicator = value[8]
    if(sample_component_repeat_indicator == "0"):
        sample_component_repeat_indicator = "no repeating used"
    else:
        sample_component_repeat_indicator = "repeating used"

    val = {
        "raw value" : hex(int(value,2)),
        "packing_method" : packing_method
        , "real_complex_type" : real_complex_type
        , "data_item_format" : data_item_format
        , "sample_component_repeat_indicator" : sample_component_repeat_indicator
        , "event_tag_size" : value[9:12]
        , "channel_tag_size" : value[12:16]
        , "data_item_fraction_size" : value[16:20]
        , "item_packaging_field_size" : packing_field_size
        , "data_item_size" : data_item_size #value[26:32]
        , "repeat_count" : value[32:49]
        , "vector_size" : value[49:65]
        }
        
    return val

####Plot IQ data, depending on context information (also save, do not comment out this function. Only comment out the plot() command if no plotting desired)####
def plot_data(current_context_packet: CurrentContextPacket, header: Header, data: Data, iqdata: bytes):
    """_summary_

    :param CurrentContextPacket current_context_packet: _description_
    :param Header header: _description_
    :param Data data: _description_
    :param bytes iqdata: _description_
    """
    
    data_type = np.int16
    #extract payload information from current context packet
    #take payload information from context packet if trailer not used
    if current_context_packet is not None:
        if current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Unsigned_Fixed_Point":
            data_type = np.int16 #!!!not really, but other is not supported
        elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Signed_Fixed_Point":
            if current_context_packet.body.signal_data_packet_payload_format["Data_Item_Size"] == 32:
                data_type = np.int32
            else:
                data_type = np.int16
        elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Single_Precision_Floating_Point":
            data_type = np.float32
        elif current_context_packet.body.signal_data_packet_payload_format["data_item_format"] == "Single_Fixed_Point_Non_Normalized":
            data_type = np.int16
        else:
            data_type = np.float32
    else:
        if header.indicators[0] == "1":
            print("Trailer information not yet implemented. See if should be implemented in the future or if data packets without context packet shall be eliminated")
            #Trailer present
            #maybe implement later
            data_type = np.int16
            
    ##CURRENTLY HARDCODED TO INT16!, CODE ABOVE NOT USED/TESTED BUT SHOULD BE USED IF SUFFICIENT TEST DATA IS AVAILABLE##
    data_type = np.int16
    samples =  np.frombuffer(iqdata, dtype=data_type)
    samples = samples[::2] + 1j*samples[1::2]
    plt.plot(samples.real, '.-')
    plt.plot(samples.imag, '.-')
    plt.legend(['I', 'Q'])
    data.iq_data = samples
    #plt.show()

#####other helping functions#####
def all_data_read(header: Header, index: int):
    """ > Check if all Data has been completely read

    :param int index: current index in packet
    """
    if (index != (header.packet_size)*4):
        logging.warning("Warning: Possibly not all Data from packet read! %1i bytes from %1i bytes read." % (index, header.packet_size*4))
        print("Warning: Possibly not all Data from packet read! %1i bytes from %1i bytes read." % (index, header.packet_size*4))
    else:
        logging.info("packet data completely read! %1i bytes from %1i bytes read." % (index, header.packet_size*4))
        print("packet data completely read! %1i bytes from %1i bytes read." % (index, header.packet_size*4))
        