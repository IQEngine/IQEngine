
from pprint import pprint
import json
from sigmf import SigMFFile
import datetime
import numpy as np
import os
from datetime import timezone, datetime


#dataclasses.dataclass
class CurrentContextPacket:
    """Stores current context packet for each data packet. Context packet object is stored in current_context dict with streamID as key and current context packet
    object as value
    """
    current_context = {}

def match_context_packet(context: object, context_dict: CurrentContextPacket):
    """function gets context packet in parse function and saves it as value in context dict with stream id as key. If
    streamID does not exist yet in dictionary, the object and according streamID are added to the dictionary. If an StreamID object pair already exists,
    the object is overwritten with the current object with that matching streamID

    :param object context: object of type Packet
    :param CurrentContextPacket context_dict: object of type currentcontextpacket (with current_context dictionary inside)
    """
    #writes current context packet correctly in dict
    streamID = context.header.stream_identifier #works but ugly, but otherwise circular imports. context is of type packet, but declared as object because import vita49 not possible
    #If Object with streamID already in dictionary, overwrite current object at that streamID. If not, new key value pair is added
    context_dict.current_context[str(streamID)] = context

def get_context_packet(header: object, context_dict: CurrentContextPacket) -> object:
    """_summary_

    :param object header: packet header of type Packet.header
    :param CurrentContextPacket context_dict: object of type currentcontextpacket (with current_context dictionary inside)
    :return _type_: object of type packet with current context packet
    """
    #Call this function in data packet to find the matching context packet
    stream_id = header.stream_identifier
    #return matching context packet with same streamID
    print(stream_id)
    if stream_id in context_dict.current_context.keys():
        current_packet = context_dict.current_context[str(stream_id)]
    else:
        current_packet = None
        print("No matching context packet for data packet found")
    return current_packet


def convert_payload_formats():
    pass

def context_to_meta(data, packet:object, stream_ids:list, current_context_packet: object, sample_start:int) -> list:
    """Function to create a sigMF metafile if it does not exist for a streamID yet. Necessary context information of vita49 data packed is written
    into captures. If metafile exists already, function adds only a capture with the given parameters(center freq, sample start, timestamp(add more later))

    :param _type_ data: IQ data written into sigmf data file
    :param object packet: object of type packet (will always be data packet as function is only called for data packets. Function does not need to be called
    for Context packets as the context packets are stored in current_context_packet for each data packet)
    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created
    :param object current_context_packet: current context packet linked to current data packet
    :param int sample_start: start of IQ data (gets incremented each data packet by the length of the IQ data in each data packet)
    :return list: list of streamIDs for which the meta file has been written
    """
    
    #write per StreamID one meta core.
    #Append per packet one capture to according meta (according to streamID)
    #Later, check if center frequency has changed and only then write new capture

    if packet.header.stream_identifier not in stream_ids:
        meta={
            "global": {
            SigMFFile.DATATYPE_KEY: 'cf32_le', #in this case cf32_le                  #From context
            #SigMFFile.SAMPLE_RATE_KEY : 48000,                                                      #From context
            SigMFFile.AUTHOR_KEY: 'irgendwas',
            SigMFFile.DESCRIPTION_KEY: "This is a test description",#add user prompt later? or just edit in file or leave out
            SigMFFile.VERSION_KEY: "1.0.0",
            #SigMFFile.START_OFFSET_KEY: 1,#free runing count timestamp if given
            SigMFFile.HW_KEY: "Test hardware description",
            #Could insert location here but field is currently overread in vita packet    
            },
            "captures": [],
            "annotations": []
}
    else:

        with open('%s.sigmf-meta' % packet.header.stream_identifier, "r") as metafile:
            meta = json.load(metafile)

    
    #write context informaiton into capture fields (if they a are not None). What if they are none?
    if current_context_packet.current_context:
        #IF reference frequency (center frequency)
        if current_context_packet.current_context[packet.header.stream_identifier].body.if_reference_frequency is not None:
            center_freq = current_context_packet.current_context[packet.header.stream_identifier].body.if_reference_frequency
        else:
            #Error?
            center_freq = 0
        #Fractional timestamp
        if current_context_packet.current_context[packet.header.stream_identifier].header.fractional_seconds_timestamp is not None:
            frac_timestamp = current_context_packet.current_context[packet.header.stream_identifier].header.fractional_seconds_timestamp
            #Check what type of timestamp (1 is None, 3 is free running count(just the number, no conversion necessary))
            if current_context_packet.current_context[packet.header.stream_identifier].header.TSI == 1:
                #sample count timestamp
                pass
            elif current_context_packet.current_context[packet.header.stream_identifier].header.TSI == 2:
                #Real time (picoseconds) timestamp
                pass
        else:
            #Error?
            frac_timestamp = 0
        #Integer timestmap
        if current_context_packet.current_context[packet.header.stream_identifier].header.integer_seconds_timestamp is not None:
            int_timestamp = current_context_packet.current_context[packet.header.stream_identifier].header.integer_seconds_timestamp
            #Check what type of timestamp (1 is None, 3 is not specified(jsut the number, no conversion necessary))
            if current_context_packet.current_context[packet.header.stream_identifier].header.TSI == 1:
                #UTC
                #This section is not tested due to lack of sufficient test data!
                int_timestamp = datetime.fromtimestamp(int_timestamp, tz=timezone.utc).strftime('%m/%d/%Y %r %Z')    
            elif current_context_packet.current_context[packet.header.stream_identifier].header.TSI == 2:
                #GPS
                pass
        else:
            #Error?
            int_timestamp = 0
    else:
        #THROW ERRORS INSTEAD?
        center_freq = 0
        frac_timestamp = 0
        int_timestamp = 0
    
    #Convert int timestamp and frac timestamp into useful information
    
    #meta.add_capture(sample_start, metadata={
    meta["captures"].append({"core:sample_start": sample_start,
                        SigMFFile.FREQUENCY_KEY: center_freq,
                        SigMFFile.DATETIME_KEY: int_timestamp}
                         )
        
    with open('%s.sigmf-meta' % packet.header.stream_identifier, "w+") as metafile:
        metafile.write(json.dumps(meta, indent=4))
        

    
    return stream_ids 

def data_to_sigmfdata(packet: object, stream_ids:list):
    """Writes IQ data from Data packet to file. 

    :param object packet: datapacket
    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created
    :return _type_: Tuple of iq_length (length of iq data in payload, so that sample start can be calculated for next data packet) and data (iq data itself in cf32)
    """
    body = packet.body
    data_type = np.complex64

    data_real = body.iq_data.real
    data_imag = body.iq_data.imag
    data = np.zeros(len(body.iq_data), dtype=data_type)
    data.real = data_real
    data.imag = data_imag
    if packet.header.stream_identifier not in stream_ids:
        #check if data file with this stream id exists even though it was not parsed yet (file from running the program before -> has to be deleted as data is just appended)
        if os.path.isfile('%s.sigmf-data' % packet.header.stream_identifier):
            os.remove('%s.sigmf-data' % packet.header.stream_identifier)
    f = open('%s.sigmf-data' % packet.header.stream_identifier, "ab")
    f.write(data)
    iq_length = len(data)

    return [data, iq_length]

def convert(packet: object, stream_ids:list, current_context_packet: object, sample_start:int) -> list:
    """Converts vita49 data packet to sigMF meta and data file

    :param object packet: object of type packet (either data packet or context packet)
    :param list stream_ids: list of streamIDs for which a meta file has been created already. Ensures that for each streamID, only one metafile is created
    :param object current_context_packet: current context packet linked to current data packet
    :param int sample_start: start of IQ data (gets incremented each data packet by the length of the IQ data in each data packet)
    :return list: tuple of streamids(list) and sample start(int)
    """
    if packet.header.packet_type == 0 or packet.header.packet_type == 1:
        #only do something if packet type is data packet. Data packet has according context information already because of match and get context packet functions
        [data, iq_length] = data_to_sigmfdata(packet, stream_ids)
        stream_ids = (context_to_meta(data, packet, stream_ids, current_context_packet, sample_start))
        sample_start = sample_start+iq_length
        
        
    return [stream_ids, sample_start]
    
    
