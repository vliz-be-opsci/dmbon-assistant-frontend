import { useState, useEffect} from "react";
import { getAllAnnotations, getAnnotationsFile, postAnnotationFile, deleteAnnotationFile, postNodeFile} from "src/utils/AxiosRequestsHandlers";
import AxiosError from "../AxiosError/AxiosError";
import {Modal} from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import {VscListTree} from "react-icons/vsc";
import $ from 'jquery';
import LoadingBlock from "../LoadingBlock/LoadingBlock";
import DatacrateContentFileRow from "../DatacrateContentFileRow/DatacrateContentFileRow";
import AnnotationTable from "../AnnotationTable/AnnotationTable";
import AnnotationValidationErrorOverview from "../AnnotationValidationErrorOverview/AnnotationValidationErrorOverview";
import ProgressBarContent from '../ProgressBar/ProgressBar';
import FileActions from 'src/components/FileActions/FileActions';
import 'react-loading-skeleton/dist/skeleton.css';
import '../component.css';
import './DatacrateContentFileTable.css'
//check if this actually does anything?

const DatacrateContentFileTable = (datacrate_uuid) => {

  const [DatacrateContent, setDatacrateContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showmodal, setShowmodal] = useState(false);
  const [showAnnotationErrors, setShowAnnotationErrors] = useState(true);
  const [modalContent, setModalContent] = useState({});
  const [specificFileContent, setSpecificFileContent] = useState({});
  const [PredicateAnnotation, setPredicateAnnotation] = useState("");
  const [ValueAnnotation, setValueAnnotation] = useState("");
  const [AddingAnnotation, setAddingAnnotation] = useState(false);
  const [DeletingAnnotation, setDeletingAnnotation] = useState(false);
  const [allResourceNodes,setAllResourceNodes] = useState([]);
  const [changemodalto, setChangemodalto] = useState("");

  //filerow specific states
  const [checkboxSelectedFiles, setCheckboxSelectedFiles] = useState([]);
  const [normalselectedfiles, setNormalselectedfiles] = useState([]);

  //fileaction state descriptions here
  const [Showuploadmodal, setShowuploadmodal] = useState(false);
  const [exploreradded, setExploreradded] = useState(false);
  const [ActionPerforming, setActionPerforming] = useState(false);
  const [ShowDeleteModal, setShowDeleteModal] = useState(false);
  const [ShowAnnotationModal, setShowAnnotationModal] = useState(false);
  const [AnnotationFileInfo, setAnnotationFileInfo] = useState([]);

  //filefolder and text search states here
  const [currentfolder, setcurrentfolder] = useState(".");
  const [listallfolders, setListallfolders] = useState([]);
  const [listcurrentfiles, setListcurrentfiles] = useState([]);
  const [searchtext, setsearchtext] = useState("");

  console.log(`predicate annotation is ${PredicateAnnotation}`);
  console.log(`datacratecontent is ${DatacrateContent}`);

  //useEffect that gets triggered by a change in the normal selected files
  useEffect(() => {
    console.log("getsummary of selected files");
    console.log(normalselectedfiles);
    let toreturn = [];
    normalselectedfiles.forEach((file) => {
      console.log(file);
      //get the summary of the file
      let filecontent = DatacrateContent[file];
      toreturn.push(filecontent);
    });
    setAnnotationFileInfo(toreturn);
    setDatacrateContent(DatacrateContent);
  }, [normalselectedfiles,checkboxSelectedFiles]);

  useEffect(() => {
    if(!exploreradded){
      setLoading(true);
      getAllAnnotations(datacrate_uuid).then(res => {
        //for entry in res.data.data, if the key contains http or https then console.log
        let contentdata = {};
        let allResourceNodess = [];
        for(let entry in res.data.data){
          if(entry.includes("http") || entry.includes("https") || !entry.startsWith("./")){
            console.log(entry);
            allResourceNodess.push(entry);
          }else{
            //add the key and value to the contentdata object
            contentdata[entry] = res.data.data[entry];
          }
        }
        setAllResourceNodes(allResourceNodess);
        setDatacrateContent(contentdata);
        console.log(res.data.data);
        setLoading(false);
      }
      ).catch(err => {
        console.log(err);
        setError(true);
        setErrorMessage(err);
        setLoading(false);
      }
      );
    }
  }, [exploreradded]);

  //useEffect that gets triggered by a change in DeleteAnnotation, if deleteAnnotationFile is false then it will get annotations for the file and set the state of DatacrateContent to the annotations
  useEffect(() => {
    if(!DeletingAnnotation){
      if(modalContent.file_name){
        console.log(modalContent.file_name);
        getAnnotationsFile(datacrate_uuid, encodeURIComponent(modalContent.file_name)).then(res => {
          console.log(res.data);
          setSpecificFileContent(res.data);
          // set the DatarcateContent.file.summary to res.data.summary
          let file_name = modalContent.file_name;
          //loop through keys of DatacrateContent and if the key is file_name then set the summary to the summary of the file
          for(let key in DatacrateContent){
            if(key === file_name){
              DatacrateContent[key]["summary"] = res.data.summary;
            }
          }

        }).catch(err => {
          console.log(err);
          setError(true);
          setErrorMessage(err);
        }
        );
      }
    }
  }, [DeletingAnnotation]);

  //useffect that gets triggered by a change in AddingAnnotation, if adding annotation is false it will get annotations for file and set the state to the annotations
  useEffect(() => {
    if(!AddingAnnotation){
      if(modalContent.file_name){
        //console.log(modalContent.file_name);
        getAnnotationsFile(datacrate_uuid, encodeURIComponent(modalContent.file_name)).then(res => {
          console.log(res.data);
          setSpecificFileContent(res.data);
          let file_name = modalContent.file_name;
          for(let key in DatacrateContent){
            if(key === file_name){
              DatacrateContent[key]["summary"] = res.data.summary;
            }
          }
        }).catch(err => {
          console.log(err);
          setError(true);
          setErrorMessage(err);
        }
        );
      }
    }
  } , [AddingAnnotation]);

  useEffect(() => {
    getAllAnnotations(datacrate_uuid).then(res => {
      //for entry in res.data.data, if the key contains http or https then console.log
      let contentdata = {};
      let allResourceNodess = [];
      let allfolders = [];
      for(let entry in res.data.data){
        //console.log(entry);
        if(entry.includes("http") || entry.includes("https") || !entry.startsWith("./")){
          //console.log('this is a resource node');
          //console.log(entry);
          //add the entry to the allResourceNodes state
          allResourceNodess.push(res.data.data[entry]);
        }else{
          //add the key and value to the contentdata object
          contentdata[entry] = res.data.data[entry];
          //split entry on / and then loop through the array and add the folder to the listallfolders state if its not already there
          let splitentry = entry.split("/");
          //get every part exept the last part of the splitentry array and merge together with a / to get the folder
          let folder = splitentry.slice(0, splitentry.length - 1).join("/");
          if(!allfolders.includes(folder)){
            allfolders = [...allfolders, folder]
          }
        }
      }
      //console.log(allfolders);
      //console.log(allResourceNodess);
      setAllResourceNodes(allResourceNodess);
      setListallfolders(allfolders);
      setDatacrateContent(contentdata);
      setListcurrentfiles(Object.keys(contentdata));
      console.log(res.data.data);
      setLoading(false);
    }
    ).catch(err => {
      console.log(err);
      setError(true);
      setErrorMessage(err);
      setLoading(false);
    }
    );
  }, [datacrate_uuid]);

  //function that converrts filename in compressed_file name
  const convertFileName = (file_to_render) => {
    // const file_to_render_compressed = file_to_render.replace(/ /g, "_");
    let file_to_render_compressed = file_to_render.replace(/ /g, "_");
    // replace . by _ to avoid problems with jquery
    file_to_render_compressed = file_to_render_compressed.replace(/\./g, "_");
    // replace / by _ to avoid problems with jquery
    file_to_render_compressed = file_to_render_compressed.replace(/\//g, "_");
    return file_to_render_compressed;
  }

  //useEffect that gets triggered by a change in breadcrumbs, it gets all the input folders from the last element in the breadcrumbs array, if array is 0 then
  //useeffect that triggers when modalcontent is updated that will fetch the specific file content
  useEffect(() => {
    if(modalContent.file_name){
      //console.log(modalContent.file_name);
      getAnnotationsFile(datacrate_uuid, encodeURIComponent(modalContent.file_name)).then(res => {
        //console.log(res.data);
        setSpecificFileContent(res.data);
      }).catch(err => {
        console.log(err);
        setError(true);
        setErrorMessage(err);
      }
      );
    }
  }
  , [modalContent]);

  //useEffect that gets triggered when currentfolder or searchtext is updated
  useEffect(() => {
    let currentfiles = [];
    let searchtextupper = searchtext.toUpperCase();
    let currentfolderupper = currentfolder.toUpperCase();

    //set checkall to false
    $(`#checkall`).prop('checked', false);
    //foreach key i ndatacratecontent, if the key contains the currentfolder and the key contains the searchtext then add the key to the currentfiles array
    for(let key in DatacrateContent){
      let keyupper = key.toUpperCase();
      if(key.toUpperCase().includes(currentfolderupper) && key.toUpperCase().includes(searchtextupper)){
        currentfiles = [...currentfiles, key];
      }
    }
    //console.log(currentfiles);
    setListcurrentfiles(currentfiles);
  }, [currentfolder, searchtext]);

  //function that returns the modal
  const MakeModal = () => {
    //check if modalContent contains the keys "info" and "file_name"
    if(modalContent.hasOwnProperty("info") && modalContent.hasOwnProperty("file_name")){
      //check if the length of oject.keys(specificFileContent) is  > 0
      //console.log(specificFileContent);
      //console.log(Object.keys(specificFileContent));
      if(Object.keys(specificFileContent).length > 0){
        return(
          <Modal show={showmodal} fullscreen={true} onHide={() => setShowmodal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {modalContent.file_name}
                <ProgressBarContent content={specificFileContent.summary} />
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {
              AnnotationValidationErrorOverview(
                 specificFileContent.shacl_requirements,
                 showAnnotationErrors,
                 setShowAnnotationErrors,
                 specificFileContent.data,
                 datacrate_uuid,
                 modalContent.file_name,
                 postAnnotationFile,
                 setAddingAnnotation,
                 postNodeFile,
                 allResourceNodes
                )
              }
              <br></br>
              {
              AnnotationTable(
                 specificFileContent.data,
                 PredicateAnnotation,
                 setPredicateAnnotation,
                 ValueAnnotation,
                 setValueAnnotation,
                 postAnnotationFile,
                 deleteAnnotationFile,
                 datacrate_uuid,
                 modalContent.file_name,
                 setAddingAnnotation,
                 setDeletingAnnotation,
                )
              }
              <br></br>
            </Modal.Body>
          </Modal>
          )
      }else{
        return(
          <Modal show={showmodal} fullscreen={true} onHide={() => setShowmodal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>{modalContent.file_name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {LoadingBlock("Loading specific file content...")}
            </Modal.Body>
          </Modal>
        )
      }
    }else{
      return(<></>)
    }
  }
  //DatacrateContentFileRow(file, file.file, datacrate_uuid)

  //return renders
  if (loading) {
    return LoadingBlock("Fetching Datacrate Content, this can take a while");
  }
  if (error) {
    return <AxiosError errorMessage={errorMessage} />;
  }
  else{
    return (
      <>
      <div className="component">
        <div className="title_file_content">
          <p>Files</p>
        {FileActions(setExploreradded, datacrate_uuid,
            Showuploadmodal, setShowuploadmodal,
            ShowDeleteModal, setShowDeleteModal,
            ShowAnnotationModal, setShowAnnotationModal,
            ActionPerforming, setActionPerforming,
            listcurrentfiles,checkboxSelectedFiles,
            normalselectedfiles,
            AnnotationFileInfo)}
        </div>
        <div className="searchbar">
          <div className="input_folder">
            <VscListTree></VscListTree>
            <select onChange={(e)=> setcurrentfolder(e.target.value)}>
              {
                listallfolders.map((folder, index) => {
                  return(<option key={index}>{folder}</option>)
                })
              }
            </select>
          </div>
          <div className="input_search">
            <FaSearch></FaSearch>
            <input type="text" placeholder="Search" onChange={(e) => setsearchtext(e.target.value)}/>
          </div>
        </div>
        <div className="metadata_file">
          <div className="content_item">
            <div className="actions"></div>
            <div className="file-storage"></div>
            <div className="file-content">
              <div className="file-name">
                  <input type="checkbox" id="checkall" onClick={(e) => {
                    if (e.target.checked) {
                      // foreach file in listcurrentfiles, push the compressed version into the checkboxSelectedFiles array
                      listcurrentfiles.forEach((file) => {
                        //check if file is already in checkboxSelectedFiles
                        if(!checkboxSelectedFiles.includes(convertFileName(file))){
                          checkboxSelectedFiles.push(convertFileName(file));
                        }
                        if(!normalselectedfiles.includes(file)){
                          normalselectedfiles.push(file);
                        }
                      });
                      console.log(checkboxSelectedFiles);
                      setNormalselectedfiles(normalselectedfiles);
                      setCheckboxSelectedFiles(checkboxSelectedFiles);
                    } else {
                      console.log(checkboxSelectedFiles);
                      console.log("unchecking files");
                      //go over all files in the listcurrentfiles array and delete all instances them from the checkboxSelectedFiles array
                      listcurrentfiles.forEach((file) => {
                        //delete all instances of the file from the checkboxSelectedFiles array
                        //TODO fix this issue where the checkboxSelectedFiles array is not updated properly
                        checkboxSelectedFiles.forEach((selectedfile, index) => {
                          if (selectedfile === convertFileName(file)) {
                            checkboxSelectedFiles.splice(index, 1);
                          }
                        });
                        //delete all instances of the file from the normalselectedfiles array
                        normalselectedfiles.forEach((selectedfile, index) => {
                          if (selectedfile === file) {
                            normalselectedfiles.splice(index, 1);
                          }
                        });
                      });
                      setNormalselectedfiles(normalselectedfiles);
                      setCheckboxSelectedFiles(checkboxSelectedFiles);
                    }
                  }}/>
                check all files
              </div>
            </div>
          </div>
          {Object.keys(DatacrateContent).map((key) => {
            //check if the key contains the currentfolder and the searchtext
            //convert key to uppercase
            let keyupper = key.toUpperCase();
            let searchtextupper = searchtext.toUpperCase();
            let currentfolderupper = currentfolder.toUpperCase();
            if(keyupper.includes(currentfolderupper) && keyupper.includes(searchtextupper)){
              return DatacrateContentFileRow(
                key,
                datacrate_uuid,
                DatacrateContent[key],
                setShowmodal,
                setModalContent,
                setSpecificFileContent,
                checkboxSelectedFiles,
                setCheckboxSelectedFiles,
                normalselectedfiles, setNormalselectedfiles
              );
            }
          }
          )}
        </div>
      </div>
      {MakeModal()}
      </>
    )
  }
}

export default DatacrateContentFileTable
