import { useState } from "react";


interface Props {
    Sororities: string[];
    heading: string;

    onSelectSorority: (sorority: string) => void;

} 


function ListGroup({Sororities, heading, onSelectSorority }: Props) {
  
    
    let answer = [
        "yes",
        "no",
    ];
    

    const check = (answer: string) => {
        return answer ==="yes" && <p>Enter Brother number</p> || answer === "no" && <p>What Sorority are you in?</p>;
    };
    
   //Hook
    const [selectedIndex, setSelectedIndex] = useState(-1);
    

    return (
        <>
            <h1>{heading}</h1>
            {check(answer[0])}
            <ul className="list-group">
                {Sororities.map((sorority, index) => 
                    <li className={ selectedIndex === index 
                        ? 'list-group-item active'
                         : 'listy-group-item'}
                     key={sorority} 
                     onClick={() => {
                         setSelectedIndex(index);
                         onSelectSorority(sorority);
                        
                     }}
                    >
                     {sorority}
                    </li>
                )} 
            </ul>
        </>
    );
}
export default ListGroup;
// This is a simple component that returns a header with the text "List Group"
